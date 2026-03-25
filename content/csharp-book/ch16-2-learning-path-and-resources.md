## Learning Path and Next Steps

> **What you'll learn:** A structured learning roadmap (weeks 1–2, months 1–3+), recommended books and resources,
> common pitfalls for C# developers (ownership confusion, fighting the borrow checker),
> and structured observability with `tracing` vs `ILogger`.
>
> **Difficulty:** 🟢 Beginner

### Immediate Next Steps (Week 1-2)
1. **Set up your environment**
   - Install Rust via [rustup.rs](https://rustup.rs/)
   - Configure VS Code with rust-analyzer extension
   - Create your first `cargo new hello_world` project

2. **Master the basics**
   - Practice ownership with simple exercises
   - Write functions with different parameter types (`&str`, `String`, `&mut`)
   - Implement basic structs and methods

3. **Error handling practice**
   - Convert C# try-catch code to Result-based patterns
   - Practice with `?` operator and `match` statements
   - Implement custom error types

### Intermediate Goals (Month 1-2)
1. **Collections and iterators**
   - Master `Vec<T>`, `HashMap<K,V>`, and `HashSet<T>`
   - Learn iterator methods: `map`, `filter`, `collect`, `fold`
   - Practice with `for` loops vs iterator chains

2. **Traits and generics**
   - Implement common traits: `Debug`, `Clone`, `PartialEq`
   - Write generic functions and structs
   - Understand trait bounds and where clauses

3. **Project structure**
   - Organize code into modules
   - Understand `pub` visibility
   - Work with external crates from crates.io

### Advanced Topics (Month 3+)
1. **Concurrency**
   - Learn about `Send` and `Sync` traits
   - Use `std::thread` for basic parallelism
   - Explore `tokio` for async programming

2. **Memory management**
   - Understand `Rc<T>` and `Arc<T>` for shared ownership
   - Learn when to use `Box<T>` for heap allocation
   - Master lifetimes for complex scenarios

3. **Real-world projects**
   - Build a CLI tool with `clap`
   - Create a web API with `axum` or `warp`
   - Write a library and publish to crates.io

### Recommended Learning Resources

#### Books
- **"The Rust Programming Language"** (free online) - The official book
- **"Rust by Example"** (free online) - Hands-on examples
- **"Programming Rust"** by Jim Blandy - Deep technical coverage

#### Online Resources
- [Rust Playground](https://play.rust-lang.org/) - Try code in browser
- [Rustlings](https://github.com/rust-lang/rustlings) - Interactive exercises
- [Rust by Example](https://doc.rust-lang.org/rust-by-example/) - Practical examples

#### Practice Projects
1. **Command-line calculator** - Practice with enums and pattern matching
2. **File organizer** - Work with filesystem and error handling
3. **JSON processor** - Learn serde and data transformation
4. **HTTP server** - Understand async programming and networking
5. **Database library** - Master traits, generics, and error handling

### Common Pitfalls for C# Developers

#### Ownership Confusion
```rust
// DON'T: Trying to use moved values
fn wrong_way() {
    let s = String::from("hello");
    takes_ownership(s);
    // println!("{}", s); // ERROR: s was moved
}

// DO: Use references or clone when needed
fn right_way() {
    let s = String::from("hello");
    borrows_string(&s);
    println!("{}", s); // OK: s is still owned here
}

fn takes_ownership(s: String) { /* s is moved here */ }
fn borrows_string(s: &str) { /* s is borrowed here */ }
```

#### Fighting the Borrow Checker
```rust
// DON'T: Multiple mutable references
fn wrong_borrowing() {
    let mut v = vec![1, 2, 3];
    let r1 = &mut v;
    // let r2 = &mut v; // ERROR: cannot borrow as mutable more than once
}

// DO: Limit scope of mutable borrows
fn right_borrowing() {
    let mut v = vec![1, 2, 3];
    {
        let r1 = &mut v;
        r1.push(4);
    } // r1 goes out of scope here
    
    let r2 = &mut v; // OK: no other mutable borrows exist
    r2.push(5);
}
```

#### Expecting Null Values
```rust
// DON'T: Expecting null-like behavior
fn no_null_in_rust() {
    // let s: String = null; // NO null in Rust!
}

// DO: Use Option<T> explicitly
fn use_option_instead() {
    let maybe_string: Option<String> = None;
    
    match maybe_string {
        Some(s) => println!("Got string: {}", s),
        None => println!("No string available"),
    }
}
```

### Final Tips

1. **Embrace the compiler** - Rust's compiler errors are helpful, not hostile
2. **Start small** - Begin with simple programs and gradually add complexity
3. **Read other people's code** - Study popular crates on GitHub
4. **Ask for help** - The Rust community is welcoming and helpful
5. **Practice regularly** - Rust's concepts become natural with practice

Remember: Rust has a learning curve, but it pays off with memory safety, performance, and fearless concurrency. The ownership system that seems restrictive at first becomes a powerful tool for writing correct, efficient programs.

---

**Congratulations!** You now have a solid foundation for transitioning from C# to Rust. Start with simple projects, be patient with the learning process, and gradually work your way up to more complex applications. The safety and performance benefits of Rust make the initial learning investment worthwhile.


<!-- ch16.2a: Structured Observability with tracing -->
## Structured Observability: `tracing` vs ILogger and Serilog

C# developers are accustomed to **structured logging** via `ILogger`, **Serilog**, or **NLog** — where log messages carry typed key-value properties. Rust's `log` crate provides basic leveled logging, but **`tracing`** is the production standard for structured observability with spans, async awareness, and distributed tracing support.

### Why `tracing` Over `log`

| Feature | `log` crate | `tracing` crate | C# Equivalent |
|---------|------------|-----------------|----------------|
| Leveled messages | ✅ `info!()`, `error!()` | ✅ `info!()`, `error!()` | `ILogger.LogInformation()` |
| Structured fields | ❌ String interpolation only | ✅ Typed key-value fields | Serilog `Log.Information("{User}", user)` |
| Spans (scoped context) | ❌ | ✅ `#[instrument]`, `span!()` | `ILogger.BeginScope()` |
| Async-aware | ❌ Loses context across `.await` | ✅ Spans follow across `.await` | `Activity` / `DiagnosticSource` |
| Distributed tracing | ❌ | ✅ OpenTelemetry integration | `System.Diagnostics.Activity` |
| Multiple output formats | Basic | JSON, pretty, compact, OTLP | Serilog sinks |

### Getting Started
```toml
# Cargo.toml
[dependencies]
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter", "json"] }
```

### Basic Usage: Structured Logging
```csharp
// C# Serilog
Log.Information("Processing order {OrderId} for {Customer}, total {Total:C}",
    orderId, customer.Name, order.Total);
// Output: Processing order 12345 for Alice, total $99.95
// JSON:  {"OrderId": 12345, "Customer": "Alice", "Total": 99.95, ...}
```

```rust
use tracing::{info, warn, error, debug, instrument};

// Structured fields — typed, not string-interpolated
info!(order_id = 12345, customer = "Alice", total = 99.95,
      "Processing order");
// Output: INFO Processing order order_id=12345 customer="Alice" total=99.95
// JSON:  {"order_id": 12345, "customer": "Alice", "total": 99.95, ...}

// Dynamic values
let order_id = 12345;
info!(order_id, "Order received");  // field name = variable name shorthand

// Conditional fields
if let Some(promo) = promo_code {
    info!(order_id, promo_code = %promo, "Promo applied");
    //                        ^ % means use Display formatting
    //                        ? would use Debug formatting
}
```

### Spans: The Killer Feature for Async Code

Spans are scoped contexts that carry fields across function calls and `.await` points — like `ILogger.BeginScope()` but async-safe.

```csharp
// C# — Activity / BeginScope
using var activity = new Activity("ProcessOrder").Start();
activity.SetTag("order_id", orderId);

using (_logger.BeginScope(new Dictionary<string, object> { ["OrderId"] = orderId }))
{
    _logger.LogInformation("Starting processing");
    await ProcessPaymentAsync();
    _logger.LogInformation("Payment complete");  // OrderId still in scope
}
```

```rust
use tracing::{info, instrument, Instrument};

// #[instrument] automatically creates a span with function args as fields
#[instrument(skip(db), fields(customer_name))]
async fn process_order(order_id: u64, db: &Database) -> Result<(), AppError> {
    let order = db.get_order(order_id).await?;
    
    // Add a field to the current span dynamically
    tracing::Span::current().record("customer_name", &order.customer_name.as_str());
    
    info!("Starting processing");
    process_payment(&order).await?;        // span context preserved across .await!
    info!(items = order.items.len(), "Payment complete");
    Ok(())
}
// Every log message inside this function automatically includes:
//   order_id=12345 customer_name="Alice"
// Even in nested async calls!

// Manual span creation (like BeginScope)
async fn batch_process(orders: Vec<u64>, db: &Database) {
    for order_id in orders {
        let span = tracing::info_span!("process_order", order_id);
        
        // .instrument(span) attaches the span to the future
        process_order(order_id, db)
            .instrument(span)
            .await
            .unwrap_or_else(|e| error!("Failed: {e}"));
    }
}
```

### Subscriber Configuration (Like Serilog Sinks)

```rust
use tracing_subscriber::{fmt, EnvFilter, layer::SubscriberExt, util::SubscriberInitExt};

fn init_tracing() {
    // Development: human-readable, colored output
    tracing_subscriber::registry()
        .with(EnvFilter::try_from_default_env()
            .unwrap_or_else(|_| "my_app=debug,tower_http=info".into()))
        .with(fmt::layer().pretty())  // Colored, indented spans
        .init();
}

fn init_tracing_production() {
    // Production: JSON output for log aggregation (like Serilog JSON sink)
    tracing_subscriber::registry()
        .with(EnvFilter::new("my_app=info"))
        .with(fmt::layer().json())  // Structured JSON
        .init();
    // Output: {"timestamp":"...","level":"INFO","fields":{"order_id":123},...}
}
```

```bash
# Control log levels via environment variable (like Serilog MinimumLevel)
RUST_LOG=my_app=debug,hyper=warn cargo run
RUST_LOG=trace cargo run  # everything
```

### Serilog → tracing Migration Cheat Sheet

| Serilog / ILogger | tracing | Notes |
|-------------------|---------|-------|
| `Log.Information("{Key}", val)` | `info!(key = val, "message")` | Fields are typed, not interpolated |
| `Log.ForContext("Key", val)` | `span.record("key", val)` | Add fields to current span |
| `using BeginScope(...)` | `#[instrument]` or `info_span!()` | Automatic with `#[instrument]` |
| `.WriteTo.Console()` | `fmt::layer()` | Human-readable |
| `.WriteTo.Seq()` / `.File()` | `fmt::layer().json()` + file redirect | Or use `tracing-appender` |
| `.Enrich.WithProperty()` | `span!(Level::INFO, "name", key = val)` | Span fields |
| `LogEventLevel.Debug` | `tracing::Level::DEBUG` | Same concept |
| `{@Object}` destructuring | `field = ?value` (Debug) or `%value` (Display) | `?` = Debug, `%` = Display |

### OpenTelemetry Integration
```toml
# For distributed tracing (like System.Diagnostics + OTLP exporter)
[dependencies]
tracing-opentelemetry = "0.22"
opentelemetry = "0.21"
opentelemetry-otlp = "0.14"
```

```rust
// Add OpenTelemetry layer alongside console output
use tracing_opentelemetry::OpenTelemetryLayer;

fn init_otel() {
    let tracer = opentelemetry_otlp::new_pipeline()
        .tracing()
        .with_exporter(opentelemetry_otlp::new_exporter().tonic())
        .install_batch(opentelemetry_sdk::runtime::Tokio)
        .expect("Failed to create OTLP tracer");

    tracing_subscriber::registry()
        .with(OpenTelemetryLayer::new(tracer))  // Send spans to Jaeger/Tempo
        .with(fmt::layer())                      // Also print to console
        .init();
}
// Now #[instrument] spans automatically become distributed traces!
```

***


