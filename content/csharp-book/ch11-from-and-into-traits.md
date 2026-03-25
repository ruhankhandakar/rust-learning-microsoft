## Type Conversions in Rust

> **What you'll learn:** `From`/`Into` traits vs C#'s implicit/explicit operators, `TryFrom`/`TryInto`
> for fallible conversions, `FromStr` for parsing, and idiomatic string conversion patterns.
>
> **Difficulty:** 🟡 Intermediate

C# uses implicit/explicit conversions and casting operators. Rust uses the `From` and `Into` traits for safe, explicit conversions.

### C# Conversion Patterns
```csharp
// C# implicit/explicit conversions
public class Temperature
{
    public double Celsius { get; }
    
    public Temperature(double celsius) { Celsius = celsius; }
    
    // Implicit conversion
    public static implicit operator double(Temperature t) => t.Celsius;
    
    // Explicit conversion
    public static explicit operator Temperature(double d) => new Temperature(d);
}

double temp = new Temperature(100.0);  // implicit
Temperature t = (Temperature)37.5;     // explicit
```

### Rust From and Into
```rust
#[derive(Debug)]
struct Temperature {
    celsius: f64,
}

impl From<f64> for Temperature {
    fn from(celsius: f64) -> Self {
        Temperature { celsius }
    }
}

impl From<Temperature> for f64 {
    fn from(temp: Temperature) -> f64 {
        temp.celsius
    }
}

fn main() {
    // From
    let temp = Temperature::from(100.0);
    
    // Into (automatically available when From is implemented)
    let temp2: Temperature = 37.5.into();
    
    // Works in function arguments too
    fn process_temp(temp: impl Into<Temperature>) {
        let t: Temperature = temp.into();
        println!("Temperature: {:.1}°C", t.celsius);
    }
    
    process_temp(98.6);
    process_temp(Temperature { celsius: 0.0 });
}
```

```mermaid
graph LR
    A["impl From&lt;f64&gt; for Temperature"] -->|"auto-generates"| B["impl Into&lt;Temperature&gt; for f64"]
    C["Temperature::from(37.5)"] -->|"explicit"| D["Temperature"]
    E["37.5.into()"] -->|"implicit via Into"| D
    F["fn process(t: impl Into&lt;Temperature&gt;)"] -->|"accepts both"| D

    style A fill:#c8e6c9,color:#000
    style B fill:#bbdefb,color:#000
```

> **Rule of thumb**: Implement `From`, and you get `Into` for free. Callers can use whichever reads better.

### TryFrom for Fallible Conversions
```rust
use std::convert::TryFrom;

impl TryFrom<i32> for Temperature {
    type Error = String;
    
    fn try_from(value: i32) -> Result<Self, Self::Error> {
        if value < -273 {
            Err(format!("Temperature {}°C is below absolute zero", value))
        } else {
            Ok(Temperature { celsius: value as f64 })
        }
    }
}

fn main() {
    match Temperature::try_from(-300) {
        Ok(t) => println!("Valid: {:?}", t),
        Err(e) => println!("Error: {}", e),
    }
}
```

### String Conversions
```rust
// ToString via Display trait
impl std::fmt::Display for Temperature {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{:.1}°C", self.celsius)
    }
}

// Now .to_string() works automatically
let s = Temperature::from(100.0).to_string(); // "100.0°C"

// FromStr for parsing
use std::str::FromStr;

impl FromStr for Temperature {
    type Err = String;
    
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        let s = s.trim_end_matches("°C").trim();
        let celsius: f64 = s.parse().map_err(|e| format!("Invalid temp: {}", e))?;
        Ok(Temperature { celsius })
    }
}

let t: Temperature = "100.0°C".parse().unwrap();
```

---

## Exercises

<details>
<summary><strong>🏋️ Exercise: Currency Converter</strong> (click to expand)</summary>

Create a `Money` struct that demonstrates the full conversion ecosystem:

1. `Money { cents: i64 }` (stores value in cents to avoid floating-point issues)
2. Implement `From<i64>` (treats input as whole dollars → `cents = dollars * 100`)
3. Implement `TryFrom<f64>` — reject negative amounts, round to nearest cent
4. Implement `Display` to show `"$1.50"` format
5. Implement `FromStr` to parse `"$1.50"` or `"1.50"` back into `Money`
6. Write a function `fn total(items: &[impl Into<Money> + Copy]) -> Money` that sums values

<details>
<summary>🔑 Solution</summary>

```rust
use std::fmt;
use std::str::FromStr;

#[derive(Debug, Clone, Copy)]
struct Money { cents: i64 }

impl From<i64> for Money {
    fn from(dollars: i64) -> Self {
        Money { cents: dollars * 100 }
    }
}

impl TryFrom<f64> for Money {
    type Error = String;
    fn try_from(value: f64) -> Result<Self, Self::Error> {
        if value < 0.0 {
            Err(format!("negative amount: {value}"))
        } else {
            Ok(Money { cents: (value * 100.0).round() as i64 })
        }
    }
}

impl fmt::Display for Money {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "${}.{:02}", self.cents / 100, self.cents.abs() % 100)
    }
}

impl FromStr for Money {
    type Err = String;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        let s = s.trim_start_matches('$');
        let val: f64 = s.parse().map_err(|e| format!("{e}"))?;
        Money::try_from(val)
    }
}

fn main() {
    let a = Money::from(10);                       // $10.00
    let b = Money::try_from(3.50).unwrap();         // $3.50
    let c: Money = "$7.25".parse().unwrap();        // $7.25
    println!("{a} + {b} + {c}");
}
```

</details>
</details>

***


