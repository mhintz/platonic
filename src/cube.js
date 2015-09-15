import {vec3} from 'gl-matrix';

import * as util from './util';

function getRawCube() {
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

  return [vertices, triangles];
}

export function createCube(options) {
  let [vertices, triangles] = getRawCube();
  return util.processGeom(vertices, triangles, options);
}
