import {vec3, quat} from 'gl-matrix';

import * as util from './util';

function getRawCube() {
  let irad = Math.sqrt(1 / 3);
  let diag = Math.sqrt(2 / 3);

  let v1 = vec3.fromValues(0, irad, diag);
  let v2 = vec3.fromValues(diag, irad, 0);
  let v3 = vec3.fromValues(0, irad, -diag);
  let v4 = vec3.fromValues(-diag, irad, 0);
  let v5 = vec3.fromValues(-diag, -irad, 0);
  let v6 = vec3.fromValues(0, -irad, diag);
  let v7 = vec3.fromValues(diag, -irad, 0);
  let v8 = vec3.fromValues(0, -irad, -diag);

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

  let opts = {
    pointOnZ: true,
    ...options
  };

  if (opts.pointOnZ) {
    // Rotates the cube around the x axis to align a point with the z axis
    let rotation = quat.create();
    quat.rotateX(rotation, rotation, Math.PI / 5);
    vertices.forEach((v) => vec3.transformQuat(v, v, rotation));
  }

  return util.processGeom(vertices, triangles, options);
}
