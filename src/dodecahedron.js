import {vec3} from 'gl-matrix';

import * as util from './util';

function getRawDodecahedron() {
  let vertices = [];

  let triangles = [];

  return [vertices, triangles];
}

export function createDodecahedron(options) {
  let [vertices, triangles] = getRawDodecahedron();
  return util.processGeom(vertices, triangles, options);
}
