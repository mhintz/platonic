const vec3 = require('gl-matrix').vec3;

const util = require('./util');

module.exports = function createCube(inputOpts={}) {
  let opts = {
    flattened: true,
    normals: true,
    sharedVertices: true,
    ...inputOpts
  };

  let len = 1 / Math.sqrt(3);

  let v1 = vec3.fromValues( len,  len,  len);
  let v2 = vec3.fromValues(-len,  len,  len);
  let v3 = vec3.fromValues(-len, -len,  len);
  let v4 = vec3.fromValues( len, -len,  len);
  let v5 = vec3.fromValues( len, -len, -len);
  let v6 = vec3.fromValues( len,  len, -len);
  let v7 = vec3.fromValues(-len,  len, -len);
  let v8 = vec3.fromValues(-len, -len, -len);

  let vertices = [ v1, v2, v3, v4, v5, v6, v7, v8 ];

  let triangles = [];

  // Front
  triangles.push([0, 1, 2]);
  triangles.push([0, 2, 3]);

  // Right
  triangles.push([5, 0, 3]);
  triangles.push([5, 3, 4]);

  // Bottom
  triangles.push([3, 2, 7]);
  triangles.push([3, 7, 4]);

  // Left
  triangles.push([1, 6, 7]);
  triangles.push([1, 7, 2]);

  // Back
  triangles.push([6, 5, 4]);
  triangles.push([6, 4, 7]);

  // Top
  triangles.push([5, 6, 1]);
  triangles.push([5, 1, 0]);

  let normals = [];

  if (opts.sharedVertices) {
    if (opts.normals) {
      // When the shape is inscribed in the unit sphere, the vertex normals are the same as the vertices!
      normals = vertices.map((v) => vec3.clone(v));      
    }
  } else {
    [vertices, triangles] = util.splitVertices(vertices, triangles);

    if (opts.normals) {
      normals = util.genFaceNormalsPerVertex(vertices, triangles);
    }

    console.log(vertices, triangles, normals);
  }

  if (opts.flattened) {
    vertices = util.flatten(vertices);
    normals = util.flatten(normals);
    triangles = util.flatten(triangles);
  }

  return {
    vertices: vertices,
    normals: normals,
    indices: triangles,
    indexCount: 36
  }
};
