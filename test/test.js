var createContext = require('webgl-context');
var createLoop = require('canvas-loop');

var glm = require('gl-matrix');
var createShader = require('gl-shader');
var createVBO = require('gl-buffer');

import * as platonic from '../index.js';

window.testCube = function() {
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
    varying vec3 v_viewNormal;
    varying vec3 v_viewPos;

    void main() {
      gl_Position = u_projection * u_vertToView * vec4(a_position, 1.);

      v_color = vec4(a_position, 1.);
      v_viewPos = (u_vertToView * vec4(a_position, 1.)).xyz;
      v_viewNormal = (u_normToView * vec4(a_normal, 1.)).xyz;
    }
  `;

  let fragShaderSrc = `
    precision highp float;

    varying vec4 v_color;
    varying vec3 v_viewNormal;
    varying vec3 v_viewPos;

    void main() {
      vec3 toCamera = - v_viewPos;
      float greyVal = clamp(dot(v_viewNormal, toCamera), 0., 1.) / 2.;
      gl_FragColor = vec4(greyVal, greyVal, greyVal, 1.);
    }
  `;

  let shader = createShader(gl, vertShaderSrc, fragShaderSrc);

  let cubeGeom = platonic.cube({ normals: true, sharedVertices: false });
  let verticesBuffer = createVBO(gl, cubeGeom.vertices);
  let normalsBuffer = createVBO(gl, cubeGeom.normals);
  let indicesBuffer = createVBO(gl, cubeGeom.indices, gl.ELEMENT_ARRAY_BUFFER);

  let modelRotation = glm.quat.create();
  let viewMatrix = glm.mat4.lookAt(glm.mat4.create(), glm.vec3.fromValues(0, 0, 2), glm.vec3.fromValues(0, 0, 0), glm.vec3.fromValues(0, -1, 0));

  let projectionMatrix = null;

  gl.clearColor(0, 0, 0, 1);
  gl.enable(gl.CULL_FACE);

  function onResize() {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    projectionMatrix = glm.mat4.perspective(glm.mat4.create(), 30, gl.canvas.width / gl.canvas.height, 0.1, 5);
  }

  onResize();

  app
  .on('tick', function tick(dt) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    shader.bind();

    glm.quat.rotateX(modelRotation, modelRotation, Math.PI / 500);
    glm.quat.rotateY(modelRotation, modelRotation, Math.PI / 500);

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
