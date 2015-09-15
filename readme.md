# Platonic

A library for generating platonic sold geometry. The platonic solids are inscribed into the unit circle, so the length of each position vector should be 1. The winding order of triangles is counter-clockwise.

The polygons are intended to be drawn with gl.drawElements, in gl.TRIANGLES mode. Drawing indices and normals are provided.

Each mesh has the following properties:

    - vertices: a 1D array of vertex data, as triplets of floats
    - normals: a 1D array of normals, as triplets of floats
    - indices: a 1D array of indices, as triplets of integers
    - indexCount: the number of indices. This is 3x the number of triangles in the shape

The generator functions accept an options object that can have the following values (defaults in parentheses)

    - flattened: (true) Before returning, the value arrays will be flattened to 1D arrays. If this property is false, the data will be returned as 2D arrays, where each sub-element is a triplet of values
    - normals: (true) If this is false, normals are not generated and the returned data is an empty array
    - splitVertices: (true) if this is false, vertex data is shared among faces that share a vertex. This is particularly important for the normals, which are calculated as the average of the normals of all triangles sharing that vertex. When the normals are interpolated across the triangle faces, you get changing values. Under the default behavior, each vertex has a normal which matches the normal for the triangle which the vertex is a part of. This involves duplicating vertex position and normal data, but it allows for flat face shading, which is more polygon-like.
