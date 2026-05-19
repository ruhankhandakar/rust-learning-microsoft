# Project 094 – Dependency Graph Visualizer (with petgraph)

## Code
Constructs a directed dependency graph using the `petgraph` crate, adding modules as nodes and dependencies as edges, and exporting the layout to a Graphviz DOT file.

---

## Problem
Analyzing complex codebases or systems requires visualizing structural relationships, verifying connection flows, identifying cyclic dependencies, and rendering diagrams.

---

## Goal
Build a dependency visualizer that models nodes and edges in a directed graph, maps module names, and writes Graphviz DOT configuration files.

---

## What I Learn
- Initializing directed graph structures using `petgraph::graph::DiGraph`
- Mapping module names to node indices using a local `HashMap` reference
- Adding connection lines (edges) with weights between nodes
- Exporting graph structures to the Graphviz DOT format using `petgraph::dot::Dot`
- Configuring DOT export options to control labels and styling
- Writing graph description data to output files on disk
- Compiling Graphviz DOT files into PNG images using shell commands

---

## Notes
- To render the generated `.dot` file into an image, you must have Graphviz installed (`sudo apt install graphviz`) and run `dot -Tpng dep_graph.dot -o graph.png`.
- `DiGraph` enforces directionality on edges, making it ideal for modeling dependencies, page ranks, or networks.
- Try adding more modules (nodes) and connections (edges) to watch how the visualized output graph adapts.
