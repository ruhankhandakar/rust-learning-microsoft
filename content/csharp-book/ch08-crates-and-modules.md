## Modules and Crates: Code Organization

> **What you'll learn:** Rust's module system vs C# namespaces and assemblies, `pub`/`pub(crate)`/`pub(super)` visibility,
> file-based module organization, and how crates map to .NET assemblies.
>
> **Difficulty:** 🟢 Beginner

Understanding Rust's module system is essential for organizing code and managing dependencies. For C# developers, this is analogous to understanding namespaces, assemblies, and NuGet packages.

### Rust Modules vs C# Namespaces

#### C# Namespace Organization
```csharp
// File: Models/User.cs
namespace MyApp.Models
{
    public class User
    {
        public string Name { get; set; }
        public int Age { get; set; }
    }
}

// File: Services/UserService.cs
using MyApp.Models;

namespace MyApp.Services
{
    public class UserService
    {
        public User CreateUser(string name, int age)
        {
            return new User { Name = name, Age = age };
        }
    }
}

// File: Program.cs
using MyApp.Models;
using MyApp.Services;

namespace MyApp
{
    class Program
    {
        static void Main(string[] args)
        {
            var service = new UserService();
            var user = service.CreateUser("Alice", 30);
        }
    }
}
```

#### Rust Module Organization
```rust
// File: src/models.rs
pub struct User {
    pub name: String,
    pub age: u32,
}

impl User {
    pub fn new(name: String, age: u32) -> User {
        User { name, age }
    }
}

// File: src/services.rs
use crate::models::User;

pub struct UserService;

impl UserService {
    pub fn create_user(name: String, age: u32) -> User {
        User::new(name, age)
    }
}

// File: src/lib.rs (or main.rs)
pub mod models;
pub mod services;

use models::User;
use services::UserService;

fn main() {
    let service = UserService;
    let user = UserService::create_user("Alice".to_string(), 30);
}
```

### Module Hierarchy and Visibility

```mermaid
graph TD
    Crate["crate (root)"] --> ModA["mod data"]
    Crate --> ModB["mod api"]
    ModA --> SubA1["pub struct Repo"]
    ModA --> SubA2["fn helper  (private)"]
    ModB --> SubB1["pub fn handle()"]
    ModB --> SubB2["pub(crate) fn internal()"]
    ModB --> SubB3["pub(super) fn parent_only()"]

    style SubA1 fill:#c8e6c9,color:#000
    style SubA2 fill:#ffcdd2,color:#000
    style SubB1 fill:#c8e6c9,color:#000
    style SubB2 fill:#fff9c4,color:#000
    style SubB3 fill:#fff9c4,color:#000
```

> 🟢 Green = public everywhere &nbsp;|&nbsp; 🟡 Yellow = restricted visibility &nbsp;|&nbsp; 🔴 Red = private

#### C# Visibility Modifiers
```csharp
namespace MyApp.Data
{
    // public - accessible from anywhere
    public class Repository
    {
        // private - only within this class
        private string connectionString;
        
        // internal - within this assembly
        internal void Connect() { }
        
        // protected - this class and subclasses
        protected virtual void Initialize() { }
        
        // public - accessible from anywhere
        public void Save(object data) { }
    }
}
```

#### Rust Visibility Rules
```rust
// Everything is private by default in Rust
mod data {
    struct Repository {  // Private struct
        connection_string: String,  // Private field
    }
    
    impl Repository {
        fn new() -> Repository {  // Private function
            Repository {
                connection_string: "localhost".to_string(),
            }
        }
        
        pub fn connect(&self) {  // Public method
            // Only accessible within this module and its children
        }
        
        pub(crate) fn initialize(&self) {  // Crate-level public
            // Accessible anywhere in this crate
        }
        
        pub(super) fn internal_method(&self) {  // Parent module public
            // Accessible in parent module
        }
    }
    
    // Public struct - accessible from outside the module
    pub struct PublicRepository {
        pub data: String,  // Public field
        private_data: String,  // Private field (no pub)
    }
}

pub use data::PublicRepository;  // Re-export for external use
```

### Module File Organization

#### C# Project Structure
```text
MyApp/
├── MyApp.csproj
├── Models/
│   ├── User.cs
│   └── Product.cs
├── Services/
│   ├── UserService.cs
│   └── ProductService.cs
├── Controllers/
│   └── ApiController.cs
└── Program.cs
```

#### Rust Module File Structure
```text
my_app/
├── Cargo.toml
└── src/
    ├── main.rs (or lib.rs)
    ├── models/
    │   ├── mod.rs        // Module declaration
    │   ├── user.rs
    │   └── product.rs
    ├── services/
    │   ├── mod.rs        // Module declaration
    │   ├── user_service.rs
    │   └── product_service.rs
    └── controllers/
        ├── mod.rs
        └── api_controller.rs
```

#### Module Declaration Patterns
```rust
// src/models/mod.rs
pub mod user;      // Declares user.rs as a submodule
pub mod product;   // Declares product.rs as a submodule

// Re-export commonly used types
pub use user::User;
pub use product::Product;

// src/main.rs
mod models;     // Declares models/ as a module
mod services;   // Declares services/ as a module

// Import specific items
use models::{User, Product};
use services::UserService;

// Or import the entire module
use models::user::*;  // Import all public items from user module
```

***

## Crates vs .NET Assemblies

### Understanding Crates
In Rust, a **crate** is the fundamental unit of compilation and code distribution, similar to how an **assembly** works in .NET.

#### C# Assembly Model
```csharp
// MyLibrary.dll - Compiled assembly
namespace MyLibrary
{
    public class Calculator
    {
        public int Add(int a, int b) => a + b;
    }
}

// MyApp.exe - Executable assembly that references MyLibrary.dll
using MyLibrary;

class Program
{
    static void Main()
    {
        var calc = new Calculator();
        Console.WriteLine(calc.Add(2, 3));
    }
}
```

#### Rust Crate Model
```toml
# Cargo.toml for library crate
[package]
name = "my_calculator"
version = "0.1.0"
edition = "2021"

[lib]
name = "my_calculator"
```

```rust
// src/lib.rs - Library crate
pub struct Calculator;

impl Calculator {
    pub fn add(&self, a: i32, b: i32) -> i32 {
        a + b
    }
}
```

```toml
# Cargo.toml for binary crate that uses the library
[package]
name = "my_app"
version = "0.1.0"
edition = "2021"

[dependencies]
my_calculator = { path = "../my_calculator" }
```

```rust
// src/main.rs - Binary crate
use my_calculator::Calculator;

fn main() {
    let calc = Calculator;
    println!("{}", calc.add(2, 3));
}
```

### Crate Types Comparison

| C# Concept | Rust Equivalent | Purpose |
|------------|----------------|---------|
| Class Library (.dll) | Library crate | Reusable code |
| Console App (.exe) | Binary crate | Executable program |
| NuGet Package | Published crate | Distribution unit |
| Assembly (.dll/.exe) | Compiled crate | Compilation unit |
| Solution (.sln) | Workspace | Multi-project organization |

### Workspace vs Solution

#### C# Solution Structure
```xml
<!-- MySolution.sln structure -->
<Solution>
    <Project Include="WebApi/WebApi.csproj" />
    <Project Include="Business/Business.csproj" />
    <Project Include="DataAccess/DataAccess.csproj" />
    <Project Include="Tests/Tests.csproj" />
</Solution>
```

#### Rust Workspace Structure
```toml
# Cargo.toml at workspace root
[workspace]
members = [
    "web_api",
    "business",
    "data_access",
    "tests"
]

[workspace.dependencies]
serde = "1.0"           # Shared dependency versions
tokio = "1.0"
```

```toml
# web_api/Cargo.toml
[package]
name = "web_api"
version = "0.1.0"
edition = "2021"

[dependencies]
business = { path = "../business" }
serde = { workspace = true }    # Use workspace version
tokio = { workspace = true }
```

---

## Exercises

<details>
<summary><strong>🏋️ Exercise: Design a Module Tree</strong> (click to expand)</summary>

Given this C# project layout, design the equivalent Rust module tree:

```csharp
// C#
namespace MyApp.Services { public class AuthService { } }
namespace MyApp.Services { internal class TokenStore { } }
namespace MyApp.Models { public class User { } }
namespace MyApp.Models { public class Session { } }
```

Requirements:
1. `AuthService` and both models must be public
2. `TokenStore` must be private to the `services` module
3. Provide the file layout **and** the `mod` / `pub` declarations in `lib.rs`

<details>
<summary>🔑 Solution</summary>

File layout:
```
src/
├── lib.rs
├── services/
│   ├── mod.rs
│   ├── auth_service.rs
│   └── token_store.rs
└── models/
    ├── mod.rs
    ├── user.rs
    └── session.rs
```

```rust,ignore
// src/lib.rs
pub mod services;
pub mod models;

// src/services/mod.rs
mod token_store;          // private — like C# internal
pub mod auth_service;     // public

// src/services/auth_service.rs
use super::token_store::TokenStore; // visible within the module

pub struct AuthService;

impl AuthService {
    pub fn login(&self) { /* uses TokenStore internally */ }
}

// src/services/token_store.rs
pub(super) struct TokenStore; // visible to parent (services) only

// src/models/mod.rs
pub mod user;
pub mod session;

// src/models/user.rs
pub struct User {
    pub name: String,
}

// src/models/session.rs
pub struct Session {
    pub user_id: u64,
}
```

</details>
</details>

***


