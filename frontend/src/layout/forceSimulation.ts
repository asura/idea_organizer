import {
  forceSimulation,
  forceCenter,
  forceLink,
  forceManyBody,
  forceCollide,
  type Simulation,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3-force';
import type { ForceConfig } from '../store/layoutStore';

export interface SimNode extends SimulationNodeDatum {
  id: string;
}

interface SimLink extends SimulationLinkDatum<SimNode> {
  source: string | SimNode;
  target: string | SimNode;
}

export interface ForceEngine {
  simulation: Simulation<SimNode, SimLink>;
  updateNodes: (nodes: SimNode[], links: SimLink[]) => void;
  pinNode: (id: string, x: number, y: number) => void;
  unpinNode: (id: string) => void;
  stop: () => void;
  reheat: () => void;
}

export function createForceSimulation(
  nodes: SimNode[],
  links: SimLink[],
  config: ForceConfig,
  onTick: (positions: Map<string, { x: number; y: number }>) => void,
): ForceEngine {
  const { boundingBox } = config;
  const halfW = boundingBox.width / 2;
  const halfH = boundingBox.height / 2;

  // Throttle tick to ~30fps
  let lastTickTime = 0;
  const TICK_INTERVAL_MS = 33;

  const sim = forceSimulation<SimNode>(nodes)
    .force('center', forceCenter(0, 0).strength(config.centerStrength))
    .force(
      'link',
      forceLink<SimNode, SimLink>(links)
        .id((d) => d.id)
        .distance(config.linkDistance)
        .strength(config.linkStrength),
    )
    .force('charge', forceManyBody<SimNode>().strength(config.chargeStrength))
    .force('collide', forceCollide<SimNode>(config.collideRadius))
    .velocityDecay(config.velocityDecay)
    .on('tick', () => {
      const now = performance.now();
      if (now - lastTickTime < TICK_INTERVAL_MS) return;
      lastTickTime = now;

      // Bounding box clamp
      for (const node of sim.nodes()) {
        if (node.fx == null) {
          node.x = Math.max(-halfW, Math.min(halfW, node.x ?? 0));
        }
        if (node.fy == null) {
          node.y = Math.max(-halfH, Math.min(halfH, node.y ?? 0));
        }
      }

      const positions = new Map<string, { x: number; y: number }>();
      for (const node of sim.nodes()) {
        positions.set(node.id, { x: node.x ?? 0, y: node.y ?? 0 });
      }
      onTick(positions);
    });

  return {
    simulation: sim,

    updateNodes(newNodes: SimNode[], newLinks: SimLink[]) {
      // Preserve positions and fixed state for existing nodes
      const existing = new Map<string, SimNode>();
      for (const node of sim.nodes()) {
        existing.set(node.id, node);
      }

      const merged = newNodes.map((n) => {
        const prev = existing.get(n.id);
        if (prev) {
          return { ...n, x: prev.x, y: prev.y, fx: prev.fx, fy: prev.fy, vx: prev.vx, vy: prev.vy };
        }
        return n;
      });

      sim.nodes(merged);
      const linkForce = sim.force('link') as ReturnType<typeof forceLink<SimNode, SimLink>> | undefined;
      linkForce?.links(newLinks);
      sim.alpha(0.3).restart();
    },

    pinNode(id: string, x: number, y: number) {
      const node = sim.nodes().find((n) => n.id === id);
      if (node) {
        node.fx = x;
        node.fy = y;
      }
    },

    unpinNode(id: string) {
      const node = sim.nodes().find((n) => n.id === id);
      if (node) {
        node.fx = null;
        node.fy = null;
      }
    },

    stop() {
      sim.stop();
    },

    reheat() {
      sim.alpha(0.5).restart();
    },
  };
}
