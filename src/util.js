import {vec3} from 'gl-matrix';

// Accepts an array of vertices and an array of three indices into the vertices array,
// and returns the normal of the resulting triangle.
function getNormal(vertices, [iA, iB, iC]) {
  const v0 = vertices[iA];
  const v1 = vertices[iB];
  const v2 = vertices[iC];

  // for triangle ABC (assuming that's in counter-clockwise order)
  // compute the normal as AB x AC
  const s1 = vec3.sub(vec3.create(), v1, v0);
  const s2 = vec3.sub(vec3.create(), v2, v0);

  let normal = vec3.cross(vec3.create(), s1, s2);

  return normal;
}

// Generates a list of normals, one for each vertex specified
// in vertices. The list will be as long as vertices, but is generated for
// each vertex as the average face normal of all triangles which include
// that vertex.
export function genAvgNormals(vertices, triangles) {
  let normalAccum = [];

  triangles.forEach((triangle) => {
    let normal = getNormal(vertices, triangle);

    triangle.forEach((index) => {
      let store = normalAccum[index];

      if (!store) {
        store = normalAccum[index] = {
          nrml: vec3.create(),
          count: 0
        };
      }

      vec3.add(store.nrml, store.nrml, normal);
      store.count += 1;
    });
  });

  let normals = normalAccum.map((store) => vec3.scale(store.nrml, store.nrml, 1 / store.count));

  return normals;
}

// Generates a list of normals, one for each triangle specified in triangles
// The list will be as long as triangles
export function genFaceNormals(vertices, triangles) {
  let normals = triangles.map((triangle) => getNormal(vertices, triangle));

  return normals;
}

// Generates a list of face normals, one for each vertex. Each normal is repeated
// once for each of the vertices contained in that triangle. The list will be as
// long as vertices. Note that the vertices you pass in should also be duplicated,
// one for each triangle. If the same vertex index is visited twice because it's used
// in more than one triangle, the normal at that index will be that of the second triangle.
export function genFaceNormalsPerVertex(vertices, triangles) {
  let normals = triangles.reduce((list, triangle) => {
    let norm = getNormal(vertices, triangle);

    list[triangle[0]] = norm;
    // Clone for other cases
    list[triangle[1]] = vec3.clone(norm);
    list[triangle[2]] = vec3.clone(norm);

    return list;
  }, []);

  return normals;
}

// Takes a list of vertices and a list of triangle groups,
// returns an expanded list of vertices and an altered list of triangle
// groups, where each vertex from the original list has been duplicated
// for each time it appears in a triangle, and the indices that point
// into the list have been adjusted accordingly
export function splitVertices(vertices, triangles) {
  let vertexList = [];
  let triangleList = [];

  triangles.forEach(([iA, iB, iC]) => {
    // Clone vertices A, B, and C and add them to the list
    vertexList.push(vec3.clone(vertices[iA]));
    vertexList.push(vec3.clone(vertices[iB]));
    vertexList.push(vec3.clone(vertices[iC]));

    let len = vertexList.length;
    triangleList.push([len - 3, len - 2, len - 1]);
  });

  return [vertexList, triangleList];
}

export function flatten(arr) {
  return arr.reduce((red, val) => {
    red.push.apply(red, val);
    return red;
  }, []);
}

export function processGeom(vertices, triangles, inputOpts={}) {
  let opts = {
    flattened: true,
    normals: true,
    splitVertices: true,
    ...inputOpts
  };

  let normals = [];

  if (opts.splitVertices) {
    [vertices, triangles] = splitVertices(vertices, triangles);

    if (opts.normals) {
      normals = genFaceNormalsPerVertex(vertices, triangles);
    }
  } else {
    if (opts.normals) {
      // When the shape is inscribed in the unit sphere, the vertex normals are the same as the vertices!
      normals = vertices.map((v) => vec3.clone(v));
    }
  }

  if (opts.flattened) {
    vertices = flatten(vertices);
    normals = flatten(normals);
    triangles = flatten(triangles);
  }

  return {
    vertices: vertices,
    normals: normals,
    indices: triangles,
    indexCount: opts.flattened ? triangles.length : triangles.length * 3
  };
}
