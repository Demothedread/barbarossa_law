// tag:3P
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
// tag:3P
import { CSS3DRenderer, CSS3DObject } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/renderers/CSS3DRenderer.js';
import { computeNodePositions } from './lq-mindmap-utils.js';

/**
 * @typedef {Object} MindMapNode
 * @property {string} id - Unique identifier.
 * @property {string} label - Display label.
 * @property {MindMapNode[]} [children] - Optional child nodes.
 */

/** Class rendering a 3D mind map. */
export class MindMap {
  /**
   * @param {HTMLElement} container - DOM element to render into.
   * @param {MindMapNode[]} data - Mind map data.
   */
  constructor(container, data) {
    this.container = container;
    this.data = data;
    this.objects = new Map();
    this.camera = null;
    this.scene = null;
    this.renderer = null;
  }

  /** Initialize scene and renderer. */
  init() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      50,
      this.container.clientWidth / this.container.clientHeight,
      1,
      5000
    );
    this.camera.position.set(0, 0, 1000);
    this.renderer = new CSS3DRenderer();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.container.appendChild(this.renderer.domElement);

    this.build();
    this.animate();
  }

  /** Recursively build DOM nodes into 3D objects. */
  build() {
    const positions = computeNodePositions(this.data);
    const create = (node) => {
      const el = document.createElement('div');
      el.className = 'mindmap-node';
      el.textContent = node.label;
      el.addEventListener('click', () => this.centerNode(node.id));

      const obj = new CSS3DObject(el);
      const p = positions[node.id];
      obj.position.set(p.x, p.y, p.z);
      this.scene.add(obj);
      this.objects.set(node.id, obj);

      (node.children || []).forEach(create);
    };

    this.data.forEach(create);
  }

  /** Center camera on a given node. */
  centerNode(id) {
    const obj = this.objects.get(id);
    if (!obj) return;
    const { x, y, z } = obj.position;
    this.camera.position.set(x, y, z + 500);
    this.camera.lookAt(obj.position);
  }

  /** Render loop. */
  animate() {
    requestAnimationFrame(() => this.animate());
    this.renderer.render(this.scene, this.camera);
  }
}

// Bootstrapping on DOM ready
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('mindmap');
    if (!container) return;
    const data = window.lqMindMapData || [];
    const map = new MindMap(container, data);
    map.init();
    window.lqMindMap = map; // expose for debugging
  });
}
