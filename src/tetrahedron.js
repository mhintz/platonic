import {vec3} from 'gl-matrix';

import * as util from './util';

function getRawTetrahedron() {
  let len = 1 / Math.sqrt(2);

  let v1 = vec3.fromValues(1, 0, -len);
  let v2 = vec3.fromValues(-1, 0, -len);
  let v3 = vec3.fromValues(0, 1, len);
  let v4 = vec3.fromValues(0, -1, len);

  let vertices = [ v1, v2, v3, v4 ];

  let triangles = [];

  triangles.push([0, 2, 3]);
  triangles.push([3, 2, 1]);
  triangles.push([1, 0, 3]);
  triangles.push([2, 0, 1]);

  return [vertices, triangles];
}

export function createTetrahedron(options) {
  let [vertices, triangles] = getRawTetrahedron();
  return util.processGeom(vertices, triangles, options);
}
