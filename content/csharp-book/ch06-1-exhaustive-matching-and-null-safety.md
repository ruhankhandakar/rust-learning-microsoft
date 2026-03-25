## Exhaustive Pattern Matching: Compiler Guarantees vs Runtime Errors

> **What you'll learn:** Why C# `switch` expressions silently miss cases while Rust's `match` catches them at compile time,
> `Option<T>` vs `Nullable<T>` for null safety, and custom error types with `Result<T, E>`.
>
> **Difficulty:** 🟡 Intermediate

### C# Switch Expressions - Still Incomplete
```csharp
// C# switch expressions look exhaustive but aren't guaranteed
public enum HttpStatus { Ok, NotFound, ServerError, Unauthorized }

public string HandleResponse(HttpStatus status) => status switch
{
    HttpStatus.Ok => "Success",
    HttpStatus.NotFound => "Resource not found",
    HttpStatus.ServerError => "Internal error",
    // Missing Unauthorized case — compiles with warning CS8524, but NOT an error!
    // Runtime: SwitchExpressionException if status is Unauthorized
};

// Even with nullable warnings, this compiles:
public class User 
{
    public string Name { get; set; }
    public bool IsActive { get; set; }
}

public string ProcessUser(User? user) => user switch
{
    { IsActive: true } => $"Active: {user.Name}",
    { IsActive: false } => $"Inactive: {user.Name}",
    // Missing null case — compiler warning CS8655, but NOT an error!
    // Runtime: SwitchExpressionException when user is null
};
```

```csharp
// Adding an enum variant later doesn't break compilation of existing switches
public enum HttpStatus 
{ 
    Ok, 
    NotFound, 
    ServerError, 
    Unauthorized,
    Forbidden  // Adding this produces another CS8524 warning but doesn't break compilation!
}
```

### Rust Pattern Matching - True Exhaustiveness
```rust
#[derive(Debug)]
enum HttpStatus {
    Ok,
    NotFound, 
    ServerError,
    Unauthorized,
}

fn handle_response(status: HttpStatus) -> &'static str {
    match status {
        HttpStatus::Ok => "Success",
        HttpStatus::NotFound => "Resource not found", 
        HttpStatus::ServerError => "Internal error",
        HttpStatus::Unauthorized => "Authentication required",
        // Compiler ERROR if any case is missing!
        // This literally will not compile
    }
}

// Adding a new variant breaks compilation everywhere it's used
#[derive(Debug)]
enum HttpStatus {
    Ok,
    NotFound,
    ServerError, 
    Unauthorized,
    Forbidden,  // Adding this breaks compilation in handle_response()
}
// The compiler forces you to handle ALL cases

// Option<T> pattern matching is also exhaustive
fn process_optional_value(value: Option<i32>) -> String {
    match value {
        Some(n) => format!("Got value: {}", n),
        None => "No value".to_string(),
        // Forgetting either case = compilation error
    }
}
```

```mermaid
graph TD
    subgraph "C# Pattern Matching Limitations"
        CS_SWITCH["switch expression"]
        CS_WARNING["⚠️ Compiler warnings only"]
        CS_COMPILE["✅ Compiles successfully"]
        CS_RUNTIME["💥 Runtime exceptions"]
        CS_DEPLOY["❌ Bugs reach production"]
        CS_SILENT["😰 Silent failures on enum changes"]
        
        CS_SWITCH --> CS_WARNING
        CS_WARNING --> CS_COMPILE
        CS_COMPILE --> CS_RUNTIME
        CS_RUNTIME --> CS_DEPLOY
        CS_SWITCH --> CS_SILENT
    end
    
    subgraph "Rust Exhaustive Matching"
        RUST_MATCH["match expression"]
        RUST_ERROR["🛑 Compilation fails"]
        RUST_FIX["✅ Must handle all cases"]
        RUST_SAFE["✅ Zero runtime surprises"]
        RUST_EVOLUTION["🔄 Enum changes break compilation"]
        RUST_REFACTOR["🛠️ Forced refactoring"]
        
        RUST_MATCH --> RUST_ERROR
        RUST_ERROR --> RUST_FIX
        RUST_FIX --> RUST_SAFE
        RUST_MATCH --> RUST_EVOLUTION
        RUST_EVOLUTION --> RUST_REFACTOR
    end
    
    style CS_RUNTIME fill:#ffcdd2,color:#000
    style CS_DEPLOY fill:#ffcdd2,color:#000
    style CS_SILENT fill:#ffcdd2,color:#000
    style RUST_SAFE fill:#c8e6c9,color:#000
    style RUST_REFACTOR fill:#c8e6c9,color:#000
```

***

## Null Safety: `Nullable<T>` vs `Option<T>`

### C# Null Handling Evolution
```csharp
// C# - Traditional null handling (error-prone)
public class User
{
    public string Name { get; set; }  // Can be null!
    public string Email { get; set; } // Can be null!
}

public string GetUserDisplayName(User user)
{
    if (user?.Name != null)  // Null conditional operator
    {
        return user.Name;
    }
    return "Unknown User";
}
```

```csharp
// C# 8+ Nullable Reference Types
public class User
{
    public string Name { get; set; }    // Non-nullable
    public string? Email { get; set; }  // Explicitly nullable
}

// C# Nullable<T> for value types
int? maybeNumber = GetNumber();
if (maybeNumber.HasValue)
{
    Console.WriteLine(maybeNumber.Value);
}
```

### Rust `Option<T>` System
```rust
// Rust - Explicit null handling with Option<T>
#[derive(Debug)]
pub struct User {
    name: String,           // Never null
    email: Option<String>,  // Explicitly optional
}

impl User {
    pub fn get_display_name(&self) -> &str {
        &self.name  // No null check needed - guaranteed to exist
    }
    
    pub fn get_email_or_default(&self) -> String {
        self.email
            .as_ref()
            .map(|e| e.clone())
            .unwrap_or_else(|| "no-email@example.com".to_string())
    }
}

// Pattern matching forces handling of None case
fn handle_optional_user(user: Option<User>) {
    match user {
        Some(u) => println!("User: {}", u.get_display_name()),
        None => println!("No user found"),
        // Compiler error if None case is not handled!
    }
}
```

```mermaid
graph TD
    subgraph "C# Null Handling Evolution"
        CS_NULL["Traditional: string name<br/>[ERROR] Can be null"]
        CS_NULLABLE["Nullable<T>: int? value<br/>[OK] Explicit for value types"]
        CS_NRT["Nullable Reference Types<br/>string? name<br/>[WARNING] Compile-time warnings only"]
        
        CS_RUNTIME["Runtime NullReferenceException<br/>[ERROR] Can still crash"]
        CS_NULL --> CS_RUNTIME
        CS_NRT -.-> CS_RUNTIME
        
        CS_CHECKS["Manual null checks<br/>if (obj?.Property != null)"]
    end
    
    subgraph "Rust Option<T> System"
        RUST_OPTION["Option<T><br/>Some(value) | None"]
        RUST_FORCE["Compiler forces handling<br/>[OK] Cannot ignore None"]
        RUST_MATCH["Pattern matching<br/>match option { ... }"]
        RUST_METHODS["Rich API<br/>.map(), .unwrap_or(), .and_then()"]
        
        RUST_OPTION --> RUST_FORCE
        RUST_FORCE --> RUST_MATCH
        RUST_FORCE --> RUST_METHODS
        
        RUST_SAFE["Compile-time null safety<br/>[OK] No null pointer exceptions"]
        RUST_MATCH --> RUST_SAFE
        RUST_METHODS --> RUST_SAFE
    end
    
    style CS_RUNTIME fill:#ffcdd2,color:#000
    style RUST_SAFE fill:#c8e6c9,color:#000
    style CS_NRT fill:#fff3e0,color:#000
    style RUST_FORCE fill:#c8e6c9,color:#000
```

***

```rust
#[derive(Debug)]
struct Point {
    x: i32,
    y: i32,
}

fn describe_point(point: Point) -> String {
    match point {
        Point { x: 0, y: 0 } => "origin".to_string(),
        Point { x: 0, y } => format!("on y-axis at y={}", y),
        Point { x, y: 0 } => format!("on x-axis at x={}", x),
        Point { x, y } if x == y => format!("on diagonal at ({}, {})", x, y),
        Point { x, y } => format!("point at ({}, {})", x, y),
    }
}
```

### Option and Result Types
```csharp
// C# nullable reference types (C# 8+)
public class PersonService
{
    private Dictionary<int, string> people = new();
    
    public string? FindPerson(int id)
    {
        return people.TryGetValue(id, out string? name) ? name : null;
    }
    
    public string GetPersonOrDefault(int id)
    {
        return FindPerson(id) ?? "Unknown";
    }
    
    // Exception-based error handling
    public void SavePerson(int id, string name)
    {
        if (string.IsNullOrEmpty(name))
            throw new ArgumentException("Name cannot be empty");
        
        people[id] = name;
    }
}
```

```rust
use std::collections::HashMap;

// Rust uses Option<T> instead of null
struct PersonService {
    people: HashMap<i32, String>,
}

impl PersonService {
    fn new() -> Self {
        PersonService {
            people: HashMap::new(),
        }
    }
    
    // Returns Option<T> - no null!
    fn find_person(&self, id: i32) -> Option<&String> {
        self.people.get(&id)
    }
    
    // Pattern matching on Option
    fn get_person_or_default(&self, id: i32) -> String {
        match self.find_person(id) {
            Some(name) => name.clone(),
            None => "Unknown".to_string(),
        }
    }
    
    // Using Option methods (more functional style)
    fn get_person_or_default_functional(&self, id: i32) -> String {
        self.find_person(id)
            .map(|name| name.clone())
            .unwrap_or_else(|| "Unknown".to_string())
    }
    
    // Result<T, E> for error handling
    fn save_person(&mut self, id: i32, name: String) -> Result<(), String> {
        if name.is_empty() {
            return Err("Name cannot be empty".to_string());
        }
        
        self.people.insert(id, name);
        Ok(())
    }
    
    // Chaining operations
    fn get_person_length(&self, id: i32) -> Option<usize> {
        self.find_person(id).map(|name| name.len())
    }
}

fn main() {
    let mut service = PersonService::new();
    
    // Handle Result
    match service.save_person(1, "Alice".to_string()) {
        Ok(()) => println!("Person saved successfully"),
        Err(error) => println!("Error: {}", error),
    }
    
    // Handle Option
    match service.find_person(1) {
        Some(name) => println!("Found: {}", name),
        None => println!("Person not found"),
    }
    
    // Functional style with Option
    let name_length = service.get_person_length(1)
        .unwrap_or(0);
    println!("Name length: {}", name_length);
    
    // Question mark operator for early returns
    fn try_operation(service: &mut PersonService) -> Result<String, String> {
        service.save_person(2, "Bob".to_string())?; // Early return if error
        let name = service.find_person(2).ok_or("Person not found")?; // Convert Option to Result
        Ok(format!("Hello, {}", name))
    }
    
    match try_operation(&mut service) {
        Ok(message) => println!("{}", message),
        Err(error) => println!("Operation failed: {}", error),
    }
}
```

### Custom Error Types
```rust
// Define custom error enum
#[derive(Debug)]
enum PersonError {
    NotFound(i32),
    InvalidName(String),
    DatabaseError(String),
}

impl std::fmt::Display for PersonError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            PersonError::NotFound(id) => write!(f, "Person with ID {} not found", id),
            PersonError::InvalidName(name) => write!(f, "Invalid name: '{}'", name),
            PersonError::DatabaseError(msg) => write!(f, "Database error: {}", msg),
        }
    }
}

impl std::error::Error for PersonError {}

// Enhanced PersonService with custom errors
impl PersonService {
    fn save_person_enhanced(&mut self, id: i32, name: String) -> Result<(), PersonError> {
        if name.is_empty() || name.len() > 50 {
            return Err(PersonError::InvalidName(name));
        }
        
        // Simulate database operation that might fail
        if id < 0 {
            return Err(PersonError::DatabaseError("Negative IDs not allowed".to_string()));
        }
        
        self.people.insert(id, name);
        Ok(())
    }
    
    fn find_person_enhanced(&self, id: i32) -> Result<&String, PersonError> {
        self.people.get(&id).ok_or(PersonError::NotFound(id))
    }
}

fn demo_error_handling() {
    let mut service = PersonService::new();
    
    // Handle different error types
    match service.save_person_enhanced(-1, "Invalid".to_string()) {
        Ok(()) => println!("Success"),
        Err(PersonError::NotFound(id)) => println!("Not found: {}", id),
        Err(PersonError::InvalidName(name)) => println!("Invalid name: {}", name),
        Err(PersonError::DatabaseError(msg)) => println!("DB Error: {}", msg),
    }
}
```

---

## Exercises

<details>
<summary><strong>🏋️ Exercise: Option Combinators</strong> (click to expand)</summary>

Rewrite this deeply nested C# null-checking code using Rust `Option` combinators (`and_then`, `map`, `unwrap_or`):

```csharp
string GetCityName(User? user)
{
    if (user != null)
        if (user.Address != null)
            if (user.Address.City != null)
                return user.Address.City.ToUpper();
    return "UNKNOWN";
}
```

Use these Rust types:
```rust
struct User { address: Option<Address> }
struct Address { city: Option<String> }
```

Write it as a **single expression** with no `if let` or `match`.

<details>
<summary>🔑 Solution</summary>

```rust
struct User { address: Option<Address> }
struct Address { city: Option<String> }

fn get_city_name(user: Option<&User>) -> String {
    user.and_then(|u| u.address.as_ref())
        .and_then(|a| a.city.as_ref())
        .map(|c| c.to_uppercase())
        .unwrap_or_else(|| "UNKNOWN".to_string())
}

fn main() {
    let user = User {
        address: Some(Address { city: Some("seattle".to_string()) }),
    };
    assert_eq!(get_city_name(Some(&user)), "SEATTLE");
    assert_eq!(get_city_name(None), "UNKNOWN");

    let no_city = User { address: Some(Address { city: None }) };
    assert_eq!(get_city_name(Some(&no_city)), "UNKNOWN");
}
```

**Key insight**: `and_then` is Rust's `?.` operator for `Option`. Each step returns `Option`, and the chain short-circuits on `None` — exactly like C#'s null-conditional operator `?.`, but explicit and type-safe.

</details>
</details>

***


