import {vec3} from 'gl-matrix';

import * as util from './util';

function getRawIcosahedron() {
  let vertices = [];

  let triangles = [];

  return [vertices, triangles];
}

export function createIcosahedron(options) {
  let [vertices, triangles] = getRawIcosahedron();
  return util.processGeom(vertices, triangles, options);
}
