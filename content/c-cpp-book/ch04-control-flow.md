# Rust if keyword

> **What you'll learn:** Rust's control flow constructs — `if`/`else` as expressions, `loop`/`while`/`for`, `match`, and how they differ from C/C++ counterparts. The key insight: most Rust control flow returns values.

- In Rust, ```if``` is actually an expression, i.e., it can be used to assign values, but it also behaves like a statement. [▶ Try it](https://play.rust-lang.org/)

```rust
fn main() {
    let x = 42;
    if x < 42 {
        println!("Smaller than the secret of life");
    } else if x == 42 {
        println!("Is equal to the secret of life");
    } else {
        println!("Larger than the secret of life");
    }
    let is_secret_of_life = if x == 42 {true} else {false};
    println!("{}", is_secret_of_life);
}
```

# Rust loops using while and for
- The ```while``` keyword can be used to loop while an expression is true
```rust
fn main() {
    let mut x = 40;
    while x != 42 {
        x += 1;
    }
}
```
- The ```for``` keyword can be used to iterate over ranges
```rust
fn main() {
    // Will not print 43; use 40..=43 to include last element
    for x in 40..43 {
        println!("{}", x);
    } 
}
```

# Rust loops using loop
- The ```loop``` keyword creates an infinite loop until a ```break``` is encountered
```rust
fn main() {
    let mut x = 40;
    // Change the below to 'here: loop to specify optional label for the loop
    loop {
        if x == 42 {
            break; // Use break x; to return the value of x
        }
        x += 1;
    }
}
```
- The ```break``` statement can include an optional expression that can be used to assign the value of a ```loop``` expression
- The ```continue``` keyword can be used to return to the top of the ```loop```
- Loop labels can be used with ```break``` or ```continue``` and are useful when dealing with nested loops

# Rust expression blocks
- Rust expression blocks are simply a sequence of expressions enclosed in ```{}```. The evaluated value is simply the last expression in the block
```rust
fn main() {
    let x = {
        let y = 40;
        y + 2 // Note: ; must be omitted
    };
    // Notice the Python style printing
    println!("{x}");
}
```
- Rust style is to use this to omit the ```return``` keyword in functions
```rust
fn is_secret_of_life(x: u32) -> bool {
    // Same as if x == 42 {true} else {false}
    x == 42 // Note: ; must be omitted 
}
fn main() {
    println!("{}", is_secret_of_life(42));
}
```


