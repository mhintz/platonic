# Platonic

A library for generating platonic sold geometry. The platonic solids are inscribed into the unit circle, so the length of each position vector should be 1. The winding order of triangles is counter-clockwise.

The polygons are intended to be drawn with `gl.drawElements`, in `gl.TRIANGLES` mode. Drawing indices and normals are provided.

### Mesh Object Properties

Each mesh has the following properties:

#### `vertices`

A 1D array of vertex data, as triplets of floats

#### `normals`

A 1D array of normals, as triplets of floats

#### `indices`

A 1D array of indices, as triplets of integers

#### `indexCount`

The number of indices. This is 3x the number of triangles in the shape

### Generator Options

The generator functions accept an options object that can have the following values (defaults in parentheses)

#### `flattened (true)`

Before returning, the value arrays will be flattened to 1D arrays. If this property is false, the data will be returned as 2D arrays, where each sub-element is a triplet of values

#### `normals (true)`

If this is false, normals are not generated and the returned data is an empty array

#### `splitVertices (true)`

If this is false, vertex data is shared among faces that share a vertex. This is particularly important for the normals, which are calculated as the average of the normals of all triangles sharing that vertex. When the normals are interpolated across the triangle faces, you get changing values. Under the default behavior, each vertex has a normal which matches the normal for the triangle which the vertex is a part of. This involves duplicating vertex position and normal data, but it allows for flat face shading, which is more polygon-like.

#### `pointOnZ (true)`

If this is true, the vertices of the model are rotated so that one of them falls on the +z axis, if necessary. This rotation lines up one of the points of the model with the z-axis. When false, the model is generated in a standard orientation relative to the axes that is convenient to calculate.
