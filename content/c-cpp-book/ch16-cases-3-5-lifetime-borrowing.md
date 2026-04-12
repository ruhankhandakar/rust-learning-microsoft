# Case Study 3: Framework communication → Lifetime borrowing

> **What you'll learn:** How to convert C++ raw-pointer framework communication patterns to Rust's lifetime-based borrowing system, eliminating dangling pointer risks while maintaining zero-cost abstractions.

## The C++ Pattern: Raw Pointer to Framework
```cpp
// C++ original: Every diagnostic module stores a raw pointer to the framework
class DiagBase {
protected:
    DiagFramework* m_pFramework;  // Raw pointer — who owns this?
public:
    DiagBase(DiagFramework* fw) : m_pFramework(fw) {}
    
    void LogEvent(uint32_t code, const std::string& msg) {
        m_pFramework->GetEventLog()->Record(code, msg);  // Hope it's still alive!
    }
};
// Problem: m_pFramework is a raw pointer with no lifetime guarantee
// If framework is destroyed while modules still reference it → UB
```

## The Rust Solution: DiagContext with Lifetime Borrowing
```rust
// Example: module.rs — Borrow, don't store

/// Context passed to diagnostic modules during execution.
/// The lifetime 'a guarantees the framework outlives the context.
pub struct DiagContext<'a> {
    pub der_log: &'a mut EventLogManager,
    pub config: &'a ModuleConfig,
    pub framework_opts: &'a HashMap<String, String>,
}

/// Modules receive context as a parameter — never store framework pointers
pub trait DiagModule {
    fn id(&self) -> &str;
    fn execute(&mut self, ctx: &mut DiagContext) -> DiagResult<()>;
    fn pre_execute(&mut self, _ctx: &mut DiagContext) -> DiagResult<()> {
        Ok(())
    }
    fn post_execute(&mut self, _ctx: &mut DiagContext) -> DiagResult<()> {
        Ok(())
    }
}
```

### Key Insight
- C++ modules **store** a pointer to the framework (danger: what if the framework is destroyed first?)
- Rust modules **receive** a context as a function parameter — the borrow checker guarantees the framework is alive during the call
- No raw pointers, no lifetime ambiguity, no "hope it's still alive"

----

# Case Study 4: God object → Composable state

## The C++ Pattern: Monolithic Framework Class
```cpp
// C++ original: The framework is god object
class DiagFramework {
    // Health-monitor trap processing
    std::vector<AlertTriggerInfo> m_alertTriggers;
    std::vector<WarnTriggerInfo> m_warnTriggers;
    bool m_healthMonHasBootTimeError;
    uint32_t m_healthMonActionCounter;
    
    // GPU diagnostics
    std::map<uint32_t, GpuPcieInfo> m_gpuPcieMap;
    bool m_isRecoveryContext;
    bool m_healthcheckDetectedDevices;
    // ... 30+ more GPU-related fields
    
    // PCIe tree
    std::shared_ptr<CPcieTreeLinux> m_pPcieTree;
    
    // Event logging
    CEventLogMgr* m_pEventLogMgr;
    
    // ... several other methods
    void HandleGpuEvents();
    void HandleNicEvents();
    void RunGpuDiag();
    // Everything depends on everything
};
```

## The Rust Solution: Composable State Structs
```rust
// Example: main.rs — State decomposed into focused structs

#[derive(Default)]
struct HealthMonitorState {
    alert_triggers: Vec<AlertTriggerInfo>,
    warn_triggers: Vec<WarnTriggerInfo>,
    health_monitor_action_counter: u32,
    health_monitor_has_boot_time_error: bool,
    // Only health-monitor-related fields
}

#[derive(Default)]
struct GpuDiagState {
    gpu_pcie_map: HashMap<u32, GpuPcieInfo>,
    is_recovery_context: bool,
    healthcheck_detected_devices: bool,
    // Only GPU-related fields
}

/// The framework composes these states rather than owning everything flat
struct DiagFramework {
    ctx: DiagContext,             // Execution context
    args: Args,                   // CLI arguments
    pcie_tree: Option<DeviceTree>,  // No shared_ptr needed
    event_log_mgr: EventLogManager,   // Owned, not raw pointer
    fc_manager: FcManager,        // Fault code management
    health: HealthMonitorState,   // Health-monitor state — its own struct
    gpu: GpuDiagState,           // GPU state — its own struct
}
```

### Key Insight
- **Testability**: Each state struct can be unit-tested independently
- **Readability**: `self.health.alert_triggers` vs `m_alertTriggers` — clear ownership
- **Fearless refactoring**: Changing `GpuDiagState` can't accidentally affect health-monitor processing
- **No method soup**: Functions that only need health-monitor state take `&mut HealthMonitorState`, not the entire framework

----

# Case Study 5: Trait objects — when they ARE right

- Not everything should be an enum! The **diagnostic module plugin system** is a genuine use case for trait objects
- Why? Because diagnostic modules are **open for extension** — new modules can be added without modifying the framework

```rust
// Example: framework.rs — Vec<Box<dyn DiagModule>> is correct here
pub struct DiagFramework {
    modules: Vec<Box<dyn DiagModule>>,        // Runtime polymorphism
    pre_diag_modules: Vec<Box<dyn DiagModule>>,
    event_log_mgr: EventLogManager,
    // ...
}

impl DiagFramework {
    /// Register a diagnostic module — any type implementing DiagModule
    pub fn register_module(&mut self, module: Box<dyn DiagModule>) {
        info!("Registering module: {}", module.id());
        self.modules.push(module);
    }
}
```

### When to Use Each Pattern

| **Use Case** | **Pattern** | **Why** |
|-------------|-----------|--------|
| Fixed set of variants known at compile time | `enum` + `match` | Exhaustive checking, no vtable |
| Hardware event types (Degrade, Fatal, Boot, ...) | `enum GpuEventKind` | All variants known, performance matters |
| PCIe device types (GPU, NIC, Switch, ...) | `enum PcieDeviceKind` | Fixed set, each variant has different data |
| Plugin/module system (open for extension) | `Box<dyn Trait>` | New modules added without modifying framework |
| Test mocking | `Box<dyn Trait>` | Inject test doubles |

### Exercise: Think Before You Translate
Given this C++ code:
```cpp
class Shape { public: virtual double area() = 0; };
class Circle : public Shape { double r; double area() override { return 3.14*r*r; } };
class Rect : public Shape { double w, h; double area() override { return w*h; } };
std::vector<std::unique_ptr<Shape>> shapes;
```
**Question**: Should the Rust translation use `enum Shape` or `Vec<Box<dyn Shape>>`?

<details><summary>Solution (click to expand)</summary>

**Answer**: `enum Shape` — because the set of shapes is **closed** (known at compile time). You'd only use `Box<dyn Shape>` if users could add new shape types at runtime.

```rust
// Correct Rust translation:
enum Shape {
    Circle { r: f64 },
    Rect { w: f64, h: f64 },
}

impl Shape {
    fn area(&self) -> f64 {
        match self {
            Shape::Circle { r } => std::f64::consts::PI * r * r,
            Shape::Rect { w, h } => w * h,
        }
    }
}

fn main() {
    let shapes: Vec<Shape> = vec![
        Shape::Circle { r: 5.0 },
        Shape::Rect { w: 3.0, h: 4.0 },
    ];
    for shape in &shapes {
        println!("Area: {:.2}", shape.area());
    }
}
// Output:
// Area: 78.54
// Area: 12.00
```

</details>

----

# Translation metrics and lessons learned

## What We Learned
1. **Default to enum dispatch** — In ~100K lines of C++, only ~25 uses of `Box<dyn Trait>` were genuinely needed (plugin systems, test mocks). The other ~900 virtual methods became enums with match
2. **Arena pattern eliminates reference cycles** — `shared_ptr` and `enable_shared_from_this` are symptoms of unclear ownership. Think about who **owns** the data first
3. **Pass context, don't store pointers** — Lifetime-bounded `DiagContext<'a>` is safer and clearer than storing `Framework*` in every module
4. **Decompose god objects** — If a struct has 30+ fields, it's probably 3-4 structs wearing a trenchcoat
5. **The compiler is your pair programmer** — ~400 `dynamic_cast` calls meant ~400 potential runtime failures. Zero `dynamic_cast` equivalents in Rust means zero runtime type errors

## The Hardest Parts
- **Lifetime annotations**: Getting borrows right takes time when you're used to raw pointers — but once it compiles, it's correct
- **Fighting the borrow checker**: Wanting `&mut self` in two places at once. Solution: decompose state into separate structs
- **Resisting literal translation**: The temptation to write `Vec<Box<dyn Base>>` everywhere. Ask: "Is this set of variants closed?" → If yes, use enum

## Recommendation for C++ Teams
1. Start with a small, self-contained module (not the god object)
2. Translate data structures first, then behavior
3. Let the compiler guide you — its error messages are excellent
4. Reach for `enum` before `dyn Trait`
5. Use the [Rust playground](https://play.rust-lang.org/) to prototype patterns before integrating

----


