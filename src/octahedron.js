import {vec3} from 'gl-matrix';

import * as util from './util';

function getRawOctahedron() {

  let v1 = vec3.fromValues(1, 0, 0);
  let v2 = vec3.fromValues(0, 1, 0);
  let v3 = vec3.fromValues(0, 0, 1);
  let v4 = vec3.fromValues(-1, 0, 0);
  let v5 = vec3.fromValues(0, -1, 0);
  let v6 = vec3.fromValues(0, 0, -1);

  let vertices = [ v1, v2, v3, v4, v5, v6 ];

  let triangles = [];

  triangles.push([0, 1, 2]); // top right front
  triangles.push([0, 5, 1]); // top right back
  triangles.push([3, 2, 1]); // top left front
  triangles.push([3, 1, 5]); // top left back
  triangles.push([0, 2, 4]); // bottom right front
  triangles.push([0, 4, 5]); // bottom right back
  triangles.push([3, 4, 2]); // bottom left front
  triangles.push([3, 5, 4]); // bottom left back

  return [vertices, triangles];
}

export function createOctahedron(options) {
  let [vertices, triangles] = getRawOctahedron();
  return util.processGeom(vertices, triangles, options);
}
