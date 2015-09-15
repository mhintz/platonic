import {vec3, quat} from 'gl-matrix';

import * as util from './util';

function getRawIcosahedron() {
  let phi = (Math.sqrt(5) + 1) * 0.5;

  let v1 = vec3.fromValues(0, -phi, 1);
  let v2 = vec3.fromValues(1, 0, phi);
  let v3 = vec3.fromValues(-1, 0, phi);
  let v4 = vec3.fromValues(-phi, -1, 0);
  let v5 = vec3.fromValues(0, -phi, -1);
  let v6 = vec3.fromValues(phi, -1, 0);
  let v7 = vec3.fromValues(phi, 1, 0);
  let v8 = vec3.fromValues(0, phi, 1);
  let v9 = vec3.fromValues(-phi, 1, 0);
  let v10 = vec3.fromValues(-1, 0, -phi);
  let v11 = vec3.fromValues(1, 0, -phi);
  let v12 = vec3.fromValues(0, phi, -1);

  let vertices = [ v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12 ];

  vertices.forEach((v) => vec3.normalize(v, v));

  let triangles = [];

  // bottom
  triangles.push([0, 1, 2]);
  triangles.push([0, 2, 3]);
  triangles.push([0, 3, 4]);
  triangles.push([0, 4, 5]);
  triangles.push([0, 5, 1]);

  // middle
  triangles.push([1, 6, 7]);
  triangles.push([1, 7, 2]);
  triangles.push([2, 7, 8]);
  triangles.push([2, 8, 3]);
  triangles.push([3, 8, 9]);
  triangles.push([3, 9, 4]);
  triangles.push([4, 9, 10]);
  triangles.push([4, 10, 5]);
  triangles.push([5, 10, 6]);
  triangles.push([5, 6, 1]);

  // top
  triangles.push([11, 7, 6]);
  triangles.push([11, 8, 7]);
  triangles.push([11, 9, 8]);
  triangles.push([11, 10, 9]);
  triangles.push([11, 6, 10]);

  return [vertices, triangles];
}

export function createIcosahedron(options) {
  let [vertices, triangles] = getRawIcosahedron();

  let opts = {
    pointOnZ: true,
    ...options
  };

  if (opts.pointOnZ) {
    let rotation = quat.create();
    quat.rotateX(rotation, rotation, Math.PI / 3);
    vertices.forEach((v) => vec3.transformQuat(v, v, rotation));
  }

  return util.processGeom(vertices, triangles, options);
}
