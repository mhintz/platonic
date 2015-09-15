import {vec3} from 'gl-matrix';

import * as util from './util';

function getRawTetrahedron() {
  let a0 = 2 * Math.PI * 0;
  let a1 = 2 * Math.PI * 1 / 3;
  let a2 = 2 * Math.PI * 2 / 3;
  // When the circumradius of the tetrahedron is 1, the height is 4 / 3
  let height = 4 / 3;
  let dBack = 1 - height; // Distance to the 'back' of the tetrahedron
  let dPoint = Math.sqrt(0.5) * height;

  let v1 = vec3.fromValues(0, 0, 1);
  let v2 = vec3.fromValues(dPoint * Math.cos(a0), dPoint * Math.sin(a0), dBack);
  let v3 = vec3.fromValues(dPoint * Math.cos(a1), dPoint * Math.sin(a1), dBack);
  let v4 = vec3.fromValues(dPoint * Math.cos(a2), dPoint * Math.sin(a2), dBack);

  let vertices = [ v1, v2, v3, v4 ];

  let triangles = [];

  triangles.push([0, 1, 2]);
  triangles.push([2, 3, 0]);
  triangles.push([3, 1, 0]);
  triangles.push([1, 3, 2]);

  return [vertices, triangles];
}

export function createTetrahedron(options) {
  let [vertices, triangles] = getRawTetrahedron();
  return util.processGeom(vertices, triangles, options);
}
