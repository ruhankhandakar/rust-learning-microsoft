## Essential Crates for C# Developers

> **What you'll learn:** The Rust crate equivalents for common .NET libraries — serde (JSON.NET),
> reqwest (HttpClient), tokio (Task/async), sqlx (Entity Framework), and a deep dive on serde's
> attribute system compared to `System.Text.Json`.
>
> **Difficulty:** 🟡 Intermediate

### Core Functionality Equivalents

```rust
// Cargo.toml dependencies for C# developers
[dependencies]
# Serialization (like Newtonsoft.Json or System.Text.Json)
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

# HTTP client (like HttpClient)
reqwest = { version = "0.11", features = ["json"] }

# Async runtime (like Task.Run, async/await)
tokio = { version = "1.0", features = ["full"] }

# Error handling (like custom exceptions)
thiserror = "1.0"
anyhow = "1.0"

# Logging (like ILogger, Serilog)
log = "0.4"
env_logger = "0.10"

# Date/time (like DateTime)
chrono = { version = "0.4", features = ["serde"] }

# UUID (like System.Guid)
uuid = { version = "1.0", features = ["v4", "serde"] }

# Collections (like List<T>, Dictionary<K,V>)
# Built into std, but for advanced collections:
indexmap = "2.0"  # Ordered HashMap

# Configuration (like IConfiguration)
config = "0.13"

# Database (like Entity Framework)
sqlx = { version = "0.7", features = ["runtime-tokio-rustls", "postgres", "uuid", "chrono"] }

# Testing (like xUnit, NUnit)
# Built into std, but for more features:
rstest = "0.18"  # Parameterized tests

# Mocking (like Moq)
mockall = "0.11"

# Parallel processing (like Parallel.ForEach)
rayon = "1.7"
```

### Example Usage Patterns

```rust
use serde::{Deserialize, Serialize};
use reqwest;
use tokio;
use thiserror::Error;
use chrono::{DateTime, Utc};
use uuid::Uuid;

// Data models (like C# POCOs with attributes)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: Uuid,
    pub name: String,
    pub email: String,
    #[serde(with = "chrono::serde::ts_seconds")]
    pub created_at: DateTime<Utc>,
}

// Custom error types (like custom exceptions)
#[derive(Error, Debug)]
pub enum ApiError {
    #[error("HTTP request failed: {0}")]
    Http(#[from] reqwest::Error),
    
    #[error("Serialization failed: {0}")]
    Serialization(#[from] serde_json::Error),
    
    #[error("User not found: {id}")]
    UserNotFound { id: Uuid },
    
    #[error("Validation failed: {message}")]
    Validation { message: String },
}

// Service class equivalent
pub struct UserService {
    client: reqwest::Client,
    base_url: String,
}

impl UserService {
    pub fn new(base_url: String) -> Self {
        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(30))
            .build()
            .expect("Failed to create HTTP client");
            
        UserService { client, base_url }
    }
    
    // Async method (like C# async Task<User>)
    pub async fn get_user(&self, id: Uuid) -> Result<User, ApiError> {
        let url = format!("{}/users/{}", self.base_url, id);
        
        let response = self.client
            .get(&url)
            .send()
            .await?;
        
        if response.status() == 404 {
            return Err(ApiError::UserNotFound { id });
        }
        
        let user = response.json::<User>().await?;
        Ok(user)
    }
    
    // Create user (like C# async Task<User>)
    pub async fn create_user(&self, name: String, email: String) -> Result<User, ApiError> {
        if name.trim().is_empty() {
            return Err(ApiError::Validation {
                message: "Name cannot be empty".to_string(),
            });
        }
        
        let new_user = User {
            id: Uuid::new_v4(),
            name,
            email,
            created_at: Utc::now(),
        };
        
        let response = self.client
            .post(&format!("{}/users", self.base_url))
            .json(&new_user)
            .send()
            .await?;
        
        let created_user = response.json::<User>().await?;
        Ok(created_user)
    }
}

// Usage example (like C# Main method)
#[tokio::main]
async fn main() -> Result<(), ApiError> {
    // Initialize logging (like configuring ILogger)
    env_logger::init();
    
    let service = UserService::new("https://api.example.com".to_string());
    
    // Create user
    let user = service.create_user(
        "John Doe".to_string(),
        "john@example.com".to_string(),
    ).await?;
    
    println!("Created user: {:?}", user);
    
    // Get user
    let retrieved_user = service.get_user(user.id).await?;
    println!("Retrieved user: {:?}", retrieved_user);
    
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]  // Like C# [Test] or [Fact]
    async fn test_user_creation() {
        let service = UserService::new("http://localhost:8080".to_string());
        
        let result = service.create_user(
            "Test User".to_string(),
            "test@example.com".to_string(),
        ).await;
        
        assert!(result.is_ok());
        let user = result.unwrap();
        assert_eq!(user.name, "Test User");
        assert_eq!(user.email, "test@example.com");
    }
    
    #[test]
    fn test_validation() {
        // Synchronous test
        let error = ApiError::Validation {
            message: "Invalid input".to_string(),
        };
        
        assert_eq!(error.to_string(), "Validation failed: Invalid input");
    }
}
```

***


<!-- ch15.1a: Serde Deep Dive for C# Developers -->
## Serde Deep Dive: JSON Serialization for C# Developers

C# developers rely heavily on `System.Text.Json` or `Newtonsoft.Json`. In Rust, **serde** (serialize/deserialize) is the universal framework — understanding its attribute system unlocks most data-handling scenarios.

### Basic Derive: The Starting Point
```rust
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
struct User {
    name: String,
    age: u32,
    email: String,
}

let user = User { name: "Alice".into(), age: 30, email: "alice@co.com".into() };
let json = serde_json::to_string_pretty(&user)?;
let parsed: User = serde_json::from_str(&json)?;
```

```csharp
// C# equivalent
public class User
{
    public string Name { get; set; }
    public int Age { get; set; }
    public string Email { get; set; }
}
var json = JsonSerializer.Serialize(user, new JsonSerializerOptions { WriteIndented = true });
var parsed = JsonSerializer.Deserialize<User>(json);
```

### Field-Level Attributes (Like `[JsonProperty]`)

```rust
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
struct ApiResponse {
    // Rename field in JSON output (like [JsonPropertyName("user_id")])
    #[serde(rename = "user_id")]
    id: u64,

    // Use different names for serialize vs deserialize
    #[serde(rename(serialize = "userName", deserialize = "user_name"))]
    name: String,

    // Skip this field entirely (like [JsonIgnore])
    #[serde(skip)]
    internal_cache: Option<String>,

    // Skip during serialization only
    #[serde(skip_serializing)]
    password_hash: String,

    // Default value if missing from JSON (like default constructor values)
    #[serde(default)]
    is_active: bool,

    // Custom default
    #[serde(default = "default_role")]
    role: String,

    // Flatten a nested struct into the parent (like [JsonExtensionData])
    #[serde(flatten)]
    metadata: Metadata,

    // Skip if the value is None (omit null fields)
    #[serde(skip_serializing_if = "Option::is_none")]
    nickname: Option<String>,
}

fn default_role() -> String { "viewer".into() }

#[derive(Serialize, Deserialize, Debug)]
struct Metadata {
    created_at: String,
    version: u32,
}
```

```csharp
// C# equivalent attributes
public class ApiResponse
{
    [JsonPropertyName("user_id")]
    public ulong Id { get; set; }

    [JsonIgnore]
    public string? InternalCache { get; set; }

    [JsonExtensionData]
    public Dictionary<string, JsonElement>? Metadata { get; set; }
}
```

### Enum Representations (Critical Difference from C#)

Rust serde supports **four different JSON representations** for enums — a concept that has no direct C# equivalent because C# enums are always integers or strings.

```rust
use serde::{Deserialize, Serialize};

// 1. Externally tagged (DEFAULT) — most common
#[derive(Serialize, Deserialize)]
enum Message {
    Text(String),
    Image { url: String, width: u32 },
    Ping,
}
// Text variant:  {"Text": "hello"}
// Image variant: {"Image": {"url": "...", "width": 100}}
// Ping variant:  "Ping"

// 2. Internally tagged — like discriminated unions in other languages
#[derive(Serialize, Deserialize)]
#[serde(tag = "type")]
enum Event {
    Created { id: u64, name: String },
    Deleted { id: u64 },
    Updated { id: u64, fields: Vec<String> },
}
// {"type": "Created", "id": 1, "name": "Alice"}
// {"type": "Deleted", "id": 1}

// 3. Adjacently tagged — tag and content in separate fields
#[derive(Serialize, Deserialize)]
#[serde(tag = "t", content = "c")]
enum ApiResult {
    Success(UserData),
    Error(String),
}
// {"t": "Success", "c": {"name": "Alice"}}
// {"t": "Error", "c": "not found"}

// 4. Untagged — serde tries each variant in order
#[derive(Serialize, Deserialize)]
#[serde(untagged)]
enum FlexibleValue {
    Integer(i64),
    Float(f64),
    Text(String),
    Bool(bool),
}
// 42, 3.14, "hello", true — serde auto-detects the variant
```

### Custom Serialization (Like `JsonConverter`)
```rust
use serde::{Deserialize, Deserializer, Serialize, Serializer};

// Custom serialization for a specific field
#[derive(Serialize, Deserialize)]
struct Config {
    #[serde(serialize_with = "serialize_duration", deserialize_with = "deserialize_duration")]
    timeout: std::time::Duration,
}

fn serialize_duration<S: Serializer>(dur: &std::time::Duration, s: S) -> Result<S::Ok, S::Error> {
    s.serialize_u64(dur.as_millis() as u64)
}

fn deserialize_duration<'de, D: Deserializer<'de>>(d: D) -> Result<std::time::Duration, D::Error> {
    let ms = u64::deserialize(d)?;
    Ok(std::time::Duration::from_millis(ms))
}
// JSON: {"timeout": 5000}  ↔  Config { timeout: Duration::from_millis(5000) }
```

### Container-Level Attributes

```rust
#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]  // All fields become camelCase in JSON
struct UserProfile {
    first_name: String,      // → "firstName"
    last_name: String,       // → "lastName"
    email_address: String,   // → "emailAddress"
}

#[derive(Serialize, Deserialize)]
#[serde(deny_unknown_fields)]  // Reject JSON with extra fields (strict parsing)
struct StrictConfig {
    port: u16,
    host: String,
}
// serde_json::from_str::<StrictConfig>(r#"{"port":8080,"host":"localhost","extra":true}"#)
// → Error: unknown field `extra`
```

### Quick Reference: Serde Attributes

| Attribute | Level | C# Equivalent | Purpose |
|-----------|-------|---------------|---------|
| `#[serde(rename = "...")]` | Field | `[JsonPropertyName]` | Rename in JSON |
| `#[serde(skip)]` | Field | `[JsonIgnore]` | Omit entirely |
| `#[serde(default)]` | Field | Default value | Use `Default::default()` if missing |
| `#[serde(flatten)]` | Field | `[JsonExtensionData]` | Merge nested struct into parent |
| `#[serde(skip_serializing_if = "...")]` | Field | `JsonIgnoreCondition` | Conditional skip |
| `#[serde(rename_all = "camelCase")]` | Container | `JsonSerializerOptions.PropertyNamingPolicy` | Naming convention |
| `#[serde(deny_unknown_fields)]` | Container | — | Strict deserialization |
| `#[serde(tag = "type")]` | Enum | Discriminator pattern | Internal tagging |
| `#[serde(untagged)]` | Enum | — | Try variants in order |
| `#[serde(with = "...")]` | Field | `[JsonConverter]` | Custom ser/de |

### Beyond JSON: serde Works Everywhere
```rust
// The SAME derive works for ALL formats — just change the crate
let user = User { name: "Alice".into(), age: 30, email: "a@b.com".into() };

let json  = serde_json::to_string(&user)?;        // JSON
let toml  = toml::to_string(&user)?;               // TOML (config files)
let yaml  = serde_yaml::to_string(&user)?;          // YAML
let cbor  = serde_cbor::to_vec(&user)?;             // CBOR (binary, compact)
let msgpk = rmp_serde::to_vec(&user)?;              // MessagePack (binary)

// One #[derive(Serialize, Deserialize)] — every format for free
```

***


