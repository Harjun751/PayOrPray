
'use strict';

/**
 * Simplify Debts using Dinic's algorithm (single-file JavaScript version)
 *
 * Original Java author: Mithun Mohan K, mithunmk93@gmail.com
 * JS conversion: M365 Copilot
 *
 * Notes:
 * - Keeps the original control flow and data structures closely aligned with Java.
 * - Uses adjacency lists for the flow network.
 * - Rebuilds the graph per iteration, carrying forward remaining capacities and a single
 *   source->sink edge with the computed max flow for the processed pair.
 */

// -------------------- Flow Edge --------------------

class Edge {
    constructor(from, to, capacity, cost = 0) {
        if (capacity < 0) throw new Error('Capacity < 0');
        this.from = from;
        this.to = to;
        this.capacity = capacity;
        this.originalCost = cost;
        this.cost = cost;

        // Residual edge (paired later)
        this.residual = null;

        // Current flow through this edge
        this.flow = 0;
    }

    isResidual() {
        return this.capacity === 0;
    }

    remainingCapacity() {
        return this.capacity - this.flow;
    }

    augment(bottleNeck) {
        this.flow += bottleNeck;
        this.residual.flow -= bottleNeck;
    }

    toString(s, t) {
        const u = (this.from === s) ? 's' : ((this.from === t) ? 't' : String(this.from));
        const v = (this.to === s) ? 's' : ((this.to === t) ? 't' : String(this.to));
        return `Edge ${u} -> ${v} | flow = ${this.flow} | capacity = ${this.capacity} | is residual: ${this.isResidual()}`;
    }
}

// -------------------- Base Flow Solver --------------------

const INF = Number.MAX_SAFE_INTEGER / 2;

class NetworkFlowSolverBase {
    /**
     * @param {number} n Number of vertices
     * @param {string[]} vertexLabels Labels for each vertex
     */
    constructor(n, vertexLabels) {
        this.n = n;
        this.graph = Array.from({ length: n }, () => []);
        this._assignLabels(vertexLabels);

        this.minCut = new Array(n).fill(false);
        this.edges = []; // Store only forward/original edges for printing
        this.maxFlow = 0;
        this.minCost = 0;

        this.s = 0;         // source
        this.t = n - 1;     // sink
        this.solved = false;
    }

    _assignLabels(vertexLabels) {
        if (!Array.isArray(vertexLabels) || vertexLabels.length !== this.n) {
            throw new Error(`You must pass ${this.n} number of labels`);
        }
        this.vertexLabels = vertexLabels;
    }

    /**
     * Add a directed edge with residual edge.
     * @param {number} from
     * @param {number} to
     * @param {number} capacity
     * @param {number} [cost]
     */
    addEdge(from, to, capacity, cost = 0) {
        const e1 = new Edge(from, to, capacity, cost);
        const e2 = new Edge(to, from, 0, -cost);
        e1.residual = e2;
        e2.residual = e1;
        this.graph[from].push(e1);
        this.graph[to].push(e2);
        this.edges.push(e1); // store only the forward/original edge
    }

    /**
     * Bulk add edges from a list (expects Edge-like objects: {from,to,capacity})
     * @param {Edge[]} edges
     */
    addEdges(edges) {
        if (!edges) throw new Error('Edges cannot be null');
        for (const edge of edges) {
            this.addEdge(edge.from, edge.to, edge.capacity);
        }
    }

    // Accessors invoking solve() lazily
    getGraph() {
        this._execute();
        return this.graph;
    }

    getEdges() {
        return this.edges;
    }

    getMaxFlow() {
        this._execute();
        return this.maxFlow;
    }

    getMinCost() {
        this._execute();
        return this.minCost;
    }

    getMinCut() {
        this._execute();
        return this.minCut;
    }

    setSource(s) {
        this.s = s;
    }

    setSink(t) {
        this.t = t;
    }

    getSource() {
        return this.s;
    }

    getSink() {
        return this.t;
    }

    /**
     * Force recomputation for subsequent flows.
     * (Resets flags; flows remain attached to the specific graph instance just like in Java)
     */
    recompute() {
        this.solved = false;
        this.maxFlow = 0;
        this.minCut.fill(false);
    }

    printEdges() {
        for (const edge of this.edges) {
            console.log(`${this.vertexLabels[edge.from]} ----${edge.capacity}----> ${this.vertexLabels[edge.to]}`);
        }
    }

    exportEdges() {
        let arr = [];
        for (const edge of this.edges) {
            arr.push({ from: this.vertexLabels[edge.from], to: this.vertexLabels[edge.to], amount: edge.capacity})
        }
        return arr;
    }

    _execute() {
        if (this.solved) return;
        this.solved = true;
        this.maxFlow = 0; // reset before solving
        this.solve();
    }

    // To be implemented by subclasses
    solve() {
        throw new Error('solve() must be implemented by subclass');
    }
}

// -------------------- Dinic's Algorithm --------------------

class Dinics extends NetworkFlowSolverBase {
    constructor(n, vertexLabels) {
        super(n, vertexLabels);
        this.level = new Array(n).fill(0);
    }

    solve() {
        const next = new Array(this.n).fill(0);

        while (this._bfs()) {
            next.fill(0);
            for (let f = this._dfs(this.s, next, INF); f !== 0; f = this._dfs(this.s, next, INF)) {
                this.maxFlow += f;
            }
        }

        for (let i = 0; i < this.n; i++) {
            if (this.level[i] !== -1) this.minCut[i] = true;
        }
    }

    _bfs() {
        this.level.fill(-1);
        this.level[this.s] = 0;

        const q = [];
        q.push(this.s);

        while (q.length > 0) {
            const node = q.shift();
            for (const edge of this.graph[node]) {
                const cap = edge.remainingCapacity();
                if (cap > 0 && this.level[edge.to] === -1) {
                    this.level[edge.to] = this.level[node] + 1;
                    q.push(edge.to);
                }
            }
        }
        return this.level[this.t] !== -1;
    }

    _dfs(at, next, flow) {
        if (at === this.t) return flow;

        const numEdges = this.graph[at].length;

        for (; next[at] < numEdges; next[at]++) {
            const edge = this.graph[at][next[at]];
            const cap = edge.remainingCapacity();
            if (cap > 0 && this.level[edge.to] === this.level[at] + 1) {
                const bottleNeck = this._dfs(edge.to, next, Math.min(flow, cap));
                if (bottleNeck > 0) {
                    edge.augment(bottleNeck);
                    return bottleNeck;
                }
            }
        }
        return 0;
    }
}

// -------------------- Simplify Debts (main logic) --------------------

/**
 * Unique key for an edge (avoid floating precision using strings).
 */
function getEdgeKey(u, v) {
    return `${u}:${v}`;
}

/**
 * Returns the index of any non-visited edge from the provided list of edges.
 * Mirrors the original Java behavior by returning the last found unvisited edge.
 * @param {Edge[]} edges
 * @param {Set<string>} visited
 * @returns {number|null}
 */
function getNonVisitedEdge(edges, visited) {
    let edgePos = null;
    let curEdge = 0;
    for (const edge of edges) {
        if (!visited.has(getEdgeKey(edge.from, edge.to))) {
            edgePos = curEdge;
        }
        curEdge++;
    }
    return edgePos;
}

function getSimplifiedDebt(person, payments) {
    let solver = new Dinics(person.length, person);
    for (let i = 0; i < payments.length; i++) {
        solver.addEdge(person.indexOf(payments[i].from), person.indexOf(payments[i].to), payments[i].amount);
    }
    const visitedEdges = new Set();

    let edgePos;
    while ((edgePos = getNonVisitedEdge(solver.getEdges(), visitedEdges)) !== null) {
        // Force recomputation of subsequent flows in the graph
        solver.recompute();

        // Set source and sink
        const firstEdge = solver.getEdges()[edgePos];
        solver.setSource(firstEdge.from);
        solver.setSink(firstEdge.to);

        // Compute flows and get residual graph
        const residualGraph = solver.getGraph();

        // Build new edges with remaining capacity
        const newEdges = [];
        for (const allEdges of residualGraph) {
            for (const edge of allEdges) {
                // Consider remaining capacity on original edges
                // residual edges have capacity == 0 and often negative flow; skip them naturally
                const remainingFlow = (edge.flow < 0) ? edge.capacity : (edge.capacity - edge.flow);
                if (remainingFlow > 0) {
                    newEdges.push(new Edge(edge.from, edge.to, remainingFlow));
                }
            }
        }

        // Get the maximum flow for this source-sink
        const maxFlow = solver.getMaxFlow();

        // Mark edge as visited
        const source = solver.getSource();
        const sink = solver.getSink();
        visitedEdges.add(getEdgeKey(source, sink));

        // Rebuild solver for the next iteration
        solver = new Dinics(person.length, person);
        solver.addEdges(newEdges);
        // Carry forward the resolved source->sink flow
        solver.addEdge(source, sink, maxFlow);
    }
    return solver.exportEdges();
}


// Run if called directly
if (require.main === module) {
    let person = ['Alice', 'Bob', 'Charlie', 'David', 'Ema', 'Fred', 'Gabe'];
    let payments = [
        { from: "Bob", to: "Charlie", amount: 40},
        { from: "Charlie", to: "David", amount: 20 },
        { from:"David", to:"Ema", amount:50},
        { from: "Fred", to:"Bob", amount:10},
        { from: "Fred", to:"Charlie", amount:30},
        { from: "Fred", to:"David", amount:10},
        { from: "Fred", to:"Ema", amount:10},
        { from: "Gabe", to:"Bob", amount:30},
        { from: "Gabe", to:"David", amount:10},
    ]
    getSimplifiedDebt(person, payments);
}

// Export (optional, if you want to import elsewhere)
module.exports = {
    getSimplifiedDebt
};
