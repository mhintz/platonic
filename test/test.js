var createContext = require('webgl-context');
var createLoop = require('canvas-loop');

var glm = require('gl-matrix');
var createShader = require('gl-shader');
var createVBO = require('gl-buffer');

import * as platonic from '../index.js';

function runTest(generator) {
  var gl = createContext();
  var app = createLoop(gl.canvas, {
    scale: window.devicePixelRatio > 1 ? window.devicePixelRatio : 1
  });

  document.body.appendChild(gl.canvas);

  let vertShaderSrc = `
    uniform mat4 u_vertToView;
    uniform mat4 u_normToView;
    uniform mat4 u_projection;

    attribute vec3 a_position;
    attribute vec3 a_normal;

    varying vec4 v_color;
    varying vec3 v_normal;
    varying vec3 v_viewNormal;
    varying vec3 v_viewPos;

    void main() {
      gl_Position = u_projection * u_vertToView * vec4(a_position, 1.);

      v_color = vec4(a_position, 1.);
      v_normal = a_normal;
      v_viewPos = (u_vertToView * vec4(a_position, 1.)).xyz;
      v_viewNormal = (u_normToView * vec4(a_normal, 1.)).xyz;
    }
  `;

  let fragShaderSrc = `
    precision highp float;

    varying vec4 v_color;
    varying vec3 v_normal;
    varying vec3 v_viewPos;
    varying vec3 v_viewNormal;

    void main() {
      // vec3 toLight = normalize(vec3(1, 0.5, 0) - v_viewPos);
      vec3 toLight = normalize(vec3(0, 0, 0) - v_viewPos);
      vec3 normal = normalize(v_normal);
      vec3 viewNormal = normalize(v_viewNormal);

      float greyVal = clamp(dot(viewNormal, toLight), 0., 1.) * 0.5;
      gl_FragColor = vec4(0.15, 0.15, 0.15, 1.) + vec4(greyVal, greyVal, greyVal, 1.);
      // gl_FragColor = vec4(clamp(normal, 0.1, 1.), 1.);
      // gl_FragColor = vec4(clamp(viewNormal, 0.1, 1.), 1.);
    }
  `;

  let shader = createShader(gl, vertShaderSrc, fragShaderSrc);

  let cubeGeom = generator({ normals: true, splitVertices: true, pointOnZ: true });
  let verticesBuffer = createVBO(gl, cubeGeom.vertices);
  let normalsBuffer = createVBO(gl, cubeGeom.normals);
  let indicesBuffer = createVBO(gl, cubeGeom.indices, gl.ELEMENT_ARRAY_BUFFER);

  let modelRotation = glm.quat.create();

  // glm.quat.setAxisAngle(modelRotation, glm.vec3.fromValues(1, 0, 0), Math.PI / 4);
  // glm.quat.setAxisAngle(modelRotation, glm.vec3.fromValues(0, 1, 0), Math.PI / 4);
  // glm.quat.setAxisAngle(modelRotation, glm.vec3.fromValues(0, 0, 1), Math.PI / 4);

  let rotationSpeed = Math.PI / 200;

  let viewMatrix = null;
  let projectionMatrix = null;

  gl.clearColor(0, 0, 0, 1);
  gl.enable(gl.CULL_FACE);

  function onResize() {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    let ar = gl.canvas.width / gl.canvas.height;
    let nearPlaneZ = 0.5;
    let farPlaneZ = 10;
    let scale = 1.3;

    // Perspective projection test
    // viewMatrix =  glm.mat4.lookAt(glm.mat4.create(), glm.vec3.fromValues(0, 0, 5), glm.vec3.fromValues(0, 0, 0), glm.vec3.fromValues(0, 1, 0));
    // projectionMatrix = glm.mat4.perspective(glm.mat4.create(), scale * Math.PI / 7, gl.canvas.width / gl.canvas.height, nearPlaneZ, farPlaneZ);

    // Orthographic projection test
    viewMatrix =  glm.mat4.lookAt(glm.mat4.create(), glm.vec3.fromValues(0, 0, 2), glm.vec3.fromValues(0, 0, 0), glm.vec3.fromValues(0, 1, 0));
    projectionMatrix = glm.mat4.ortho(glm.mat4.create(), -ar * scale, ar * scale, -scale, scale, nearPlaneZ, farPlaneZ);
  }

  onResize();

  app
  .on('tick', function tick(dt) {
    let speedFactor = dt / 20;
    let adjustedSpeed = rotationSpeed * speedFactor;

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    shader.bind();

    glm.quat.rotateX(modelRotation, modelRotation, adjustedSpeed);
    glm.quat.rotateY(modelRotation, modelRotation, adjustedSpeed);
    glm.quat.rotateZ(modelRotation, modelRotation, adjustedSpeed);

    let modelView = glm.mat4.mul(glm.mat4.create(), viewMatrix, glm.mat4.fromQuat(glm.mat4.create(), modelRotation));
    let normalView = glm.mat4.invert(glm.mat4.create(), modelView);
    normalView = glm.mat4.transpose(normalView, normalView);

    shader.uniforms.u_vertToView = modelView;
    shader.uniforms.u_normToView = normalView;
    shader.uniforms.u_projection = projectionMatrix;

    verticesBuffer.bind();
    shader.attributes.a_position.pointer(gl.FLOAT, false, 0, 0);

    normalsBuffer.bind();
    shader.attributes.a_normal.pointer(gl.FLOAT, false, 0, 0);

    indicesBuffer.bind();

    gl.drawElements(gl.TRIANGLES, cubeGeom.indexCount, gl.UNSIGNED_SHORT, 0);
  })
  .on('resize', onResize)
  .start();
}

window.testTetrahedron = function() {
  runTest(platonic.tetrahedron);
}

window.testCube = function() {
  runTest(platonic.cube);
}

window.testOctahedron = function() {
  runTest(platonic.octahedron);
}

window.testDodecahedron = function() {
  runTest(platonic.dodecahedron);
}

window.testIcosahedron = function() {
  runTest(platonic.icosahedron);
}

