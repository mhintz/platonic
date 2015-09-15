import {vec3} from 'gl-matrix';

import * as util from './util';

// Finds average of five vertices, and sets its length to the provided length
function findPentaCenter(p1, p2, p3, p4, p5, length) {
  let out = vec3.create();
  vec3.add(out, out, p1);
  vec3.add(out, out, p2);
  vec3.add(out, out, p3);
  vec3.add(out, out, p4);
  vec3.add(out, out, p5);
  vec3.normalize(out, out);
  vec3.scale(out, out, length);
  return out;
}

function getRawDodecahedron() {
  let phi = (Math.sqrt(5) + 1) * 0.5;
  let conjphi = 1 / phi;
  let inradius = phi / Math.sqrt(9 - 3 * phi);

  // 20 Vertices
  let v1 = vec3.fromValues(-conjphi, -phi, 0);
  let v2 = vec3.fromValues(conjphi, -phi, 0);
  let v3 = vec3.fromValues(1, -1, 1);
  let v4 = vec3.fromValues(0, -conjphi, phi);
  let v5 = vec3.fromValues(-1, -1, 1);
  let v6 = vec3.fromValues(-phi, 0, conjphi);
  let v7 = vec3.fromValues(-1, -1, -1);
  let v8 = vec3.fromValues(1, -1, -1);
  let v9 = vec3.fromValues(phi, 0, conjphi);
  let v10 = vec3.fromValues(0, conjphi, phi);
  let v11 = vec3.fromValues(-1, 1, 1);
  let v12 = vec3.fromValues(-phi, 0, -conjphi);
  let v13 = vec3.fromValues(0, -conjphi, -phi);
  let v14 = vec3.fromValues(phi, 0, -conjphi);
  let v15 = vec3.fromValues(1, 1, 1);
  let v16 = vec3.fromValues(conjphi, phi, 0);
  let v17 = vec3.fromValues(-conjphi, phi, 0);
  let v18 = vec3.fromValues(-1, 1, -1);
  let v19 = vec3.fromValues(0, conjphi, -phi);
  let v20 = vec3.fromValues(1, 1, -1);

  // And 12 Centers
  let c1 = findPentaCenter(v1, v2, v3, v4, v5, inradius);
  let c2 = findPentaCenter(v1, v2, v7, v8, v13, inradius);
  let c3 = findPentaCenter(v2, v3, v8, v9, v14, inradius);
  let c4 = findPentaCenter(v3, v4, v9, v10, v15, inradius);
  let c5 = findPentaCenter(v4, v5, v6, v10, v11, inradius);
  let c6 = findPentaCenter(v1, v5, v6, v7, v12, inradius);
  let c7 = findPentaCenter(v7, v12, v13, v18, v19, inradius);
  let c8 = findPentaCenter(v8, v13, v14, v19, v20, inradius);
  let c9 = findPentaCenter(v9, v14, v15, v16, v20, inradius);
  let c10 = findPentaCenter(v10, v11, v15, v16, v17, inradius);
  let c11 = findPentaCenter(v6, v11, v12, v17, v18, inradius);
  let c12 = findPentaCenter(v16, v17, v18, v19, v20, inradius);

  let vertices = [
    v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15, v16, v17, v18, v19, v20
  ];

  vertices.forEach((v) => vec3.normalize(v, v));

  vertices.push(
    c1, c2, c3, c4, c5, c6, c7, c8, c9, c10, c11, c12
  );

  let triangles = [];

  // bottom
  triangles.push([20, 0, 1]);
  triangles.push([20, 1, 2]);
  triangles.push([20, 2, 3]);
  triangles.push([20, 3, 4]);
  triangles.push([20, 4, 0]);

  // bottom1
  triangles.push([21, 1, 0]);
  triangles.push([21, 0, 6]);
  triangles.push([21, 6, 12]);
  triangles.push([21, 12, 7]);
  triangles.push([21, 7, 1]);

  // bottom2
  triangles.push([22, 2, 1]);
  triangles.push([22, 1, 7]);
  triangles.push([22, 7, 13]);
  triangles.push([22, 13, 8]);
  triangles.push([22, 8, 2]);

  // bottom3
  triangles.push([23, 3, 2]);
  triangles.push([23, 2, 8]);
  triangles.push([23, 8, 14]);
  triangles.push([23, 14, 9]);
  triangles.push([23, 9, 3]);

  // bottom4
  triangles.push([24, 4, 3]);
  triangles.push([24, 3, 9]);
  triangles.push([24, 9, 10]);
  triangles.push([24, 10, 5]);
  triangles.push([24, 5, 4]);

  // bottom5
  triangles.push([25, 0, 4]);
  triangles.push([25, 4, 5]);
  triangles.push([25, 5, 11]);
  triangles.push([25, 11, 6]);
  triangles.push([25, 6, 0]);

  // top1
  triangles.push([26, 17, 18]);
  triangles.push([26, 18, 12]);
  triangles.push([26, 12, 6]);
  triangles.push([26, 6, 11]);
  triangles.push([26, 11, 17]);

  // top2
  triangles.push([27, 18, 19]);
  triangles.push([27, 19, 13]);
  triangles.push([27, 13, 7]);
  triangles.push([27, 7, 12]);
  triangles.push([27, 12, 18]);

  // top3
  triangles.push([28, 19, 15]);
  triangles.push([28, 15, 14]);
  triangles.push([28, 14, 8]);
  triangles.push([28, 8, 13]);
  triangles.push([28, 13, 19]);

  // top4
  triangles.push([29, 15, 16]);
  triangles.push([29, 16, 10]);
  triangles.push([29, 10, 9]);
  triangles.push([29, 9, 14]);
  triangles.push([29, 14, 15]);

  // top5
  triangles.push([30, 16, 17]);
  triangles.push([30, 17, 11]);
  triangles.push([30, 11, 5]);
  triangles.push([30, 5, 10]);
  triangles.push([30, 10, 16]);

  // top
  triangles.push([31, 15, 19]);
  triangles.push([31, 19, 18]);
  triangles.push([31, 18, 17]);
  triangles.push([31, 17, 16]);
  triangles.push([31, 16, 15]);

  return [vertices, triangles];
}

export function createDodecahedron(options) {
  let [vertices, triangles] = getRawDodecahedron();
  return util.processGeom(vertices, triangles, options);
}
