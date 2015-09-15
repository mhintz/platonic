# Platonic

A library for generating platonic sold geometry. The platonic solids are inscribed into the unit circle, so the length of each position vector should be 1. The winding order of triangles is counter-clockwise.

The polygons are intended to be drawn with gl.drawElements, in gl.TRIANGLES mode. Drawing indices and normals are provided.

Each mesh has the following properties:

```
{
    vertices: a 1D array of vertex data, as triplets of floats
    normals: a 1D array of normals, as triplets of floats
    indices: a 1D array of indices, as triplets of integers
    indexCount: the number of indices. This is 3x the number of triangles in the shape
}
```

The generator functions accept an options object that can have the following values (defaults in parentheses)

```
{
    flattened: (true) Before returning, the value arrays will be flattened to 1D arrays. If this property is false, the data will be returned as 2D arrays, where each sub-element is a triplet of values
    normals: (true) If this is false, normals are not generated and the returned data is an empty array
    sharedVertices: (true) if this is false, vertex data is not shared among triangles. The triangles will be split up into separate faces, where each vertex in each face has its own copy of its attributes.
}
```
