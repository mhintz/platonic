import {vec3, quat} from 'gl-matrix';

import * as util from './util';

function getRawCube() {
  let irad = Math.sqrt(1 / 3);
  let diag = Math.sqrt(2 / 3);

  // Rotates the cube around the x axis to align a point with the z axis
  let rotation = quat.create();
  quat.rotateX(rotation, rotation, Math.PI / 4);

  let v1 = vec3.fromValues(0, irad, diag);
  vec3.transformQuat(v1, v1, rotation);
  let v2 = vec3.fromValues(diag, irad, 0);
  vec3.transformQuat(v2, v2, rotation);
  let v3 = vec3.fromValues(0, irad, -diag);
  vec3.transformQuat(v3, v3, rotation);
  let v4 = vec3.fromValues(-diag, irad, 0);
  vec3.transformQuat(v4, v4, rotation);
  let v5 = vec3.fromValues(-diag, -irad, 0);
  vec3.transformQuat(v5, v5, rotation);
  let v6 = vec3.fromValues(0, -irad, diag);
  vec3.transformQuat(v6, v6, rotation);
  let v7 = vec3.fromValues(diag, -irad, 0);
  vec3.transformQuat(v7, v7, rotation);
  let v8 = vec3.fromValues(0, -irad, -diag);
  vec3.transformQuat(v8, v8, rotation);

  let vertices = [ v1, v2, v3, v4, v5, v6, v7, v8 ];

  let triangles = [];

  // front top
  triangles.push([0, 1, 2]);
  triangles.push([0, 2, 3]);

  // front bottom right
  triangles.push([0, 6, 1]);
  triangles.push([0, 5, 6]);

  // front bottom left
  triangles.push([0, 3, 4]);
  triangles.push([0, 4, 5]);

  // back top right
  triangles.push([7, 2, 1]);
  triangles.push([7, 1, 6]);

  // back bottom
  triangles.push([7, 6, 5]);
  triangles.push([7, 5, 4]);

  // back top left
  triangles.push([7, 4, 3]);
  triangles.push([7, 3, 2]);

  return [vertices, triangles];
}

export function createCube(options) {
  let [vertices, triangles] = getRawCube();
  return util.processGeom(vertices, triangles, options);
}
