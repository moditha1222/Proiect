/**
 * Custom Binary Min-Heap and Max-Heap implementations from scratch.
 * Zero external dependencies.
 */

class BinaryHeap {
  /**
   * @param {Function} comparator Returns negative if a has higher priority than b
   */
  constructor(comparator) {
    this.heap = [];
    this.comparator = comparator || ((a, b) => a - b);
  }

  size() {
    return this.heap.length;
  }

  isEmpty() {
    return this.heap.length === 0;
  }

  peek() {
    return this.heap.length > 0 ? this.heap[0] : null;
  }

  push(item) {
    this.heap.push(item);
    this._bubbleUp(this.heap.length - 1);
  }

  pop() {
    if (this.heap.length === 0) return null;
    const top = this.heap[0];
    const bottom = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = bottom;
      this._bubbleDown(0);
    }
    return top;
  }

  clear() {
    this.heap = [];
  }

  _bubbleUp(index) {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.comparator(this.heap[index], this.heap[parentIndex]) < 0) {
        this._swap(index, parentIndex);
        index = parentIndex;
      } else {
        break;
      }
    }
  }

  _bubbleDown(index) {
    const length = this.heap.length;
    while (true) {
      let bestIndex = index;
      const leftChild = 2 * index + 1;
      const rightChild = 2 * index + 2;

      if (
        leftChild < length &&
        this.comparator(this.heap[leftChild], this.heap[bestIndex]) < 0
      ) {
        bestIndex = leftChild;
      }

      if (
        rightChild < length &&
        this.comparator(this.heap[rightChild], this.heap[bestIndex]) < 0
      ) {
        bestIndex = rightChild;
      }

      if (bestIndex !== index) {
        this._swap(index, bestIndex);
        index = bestIndex;
      } else {
        break;
      }
    }
  }

  _swap(i, j) {
    const temp = this.heap[i];
    this.heap[i] = this.heap[j];
    this.heap[j] = temp;
  }
}

/**
 * Min-Heap: item with lowest key comes out first
 */
class MinHeap extends BinaryHeap {
  constructor(keyExtractor) {
    const fn = keyExtractor || ((x) => x);
    super((a, b) => {
      const ka = fn(a);
      const kb = fn(b);
      if (ka < kb) return -1;
      if (ka > kb) return 1;
      // Deterministic tie-breaking on id if present
      if (a && b && a.id !== undefined && b.id !== undefined) {
        return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
      }
      return 0;
    });
  }
}

/**
 * Max-Heap: item with highest key comes out first
 */
class MaxHeap extends BinaryHeap {
  constructor(keyExtractor) {
    const fn = keyExtractor || ((x) => x);
    super((a, b) => {
      const ka = fn(a);
      const kb = fn(b);
      if (ka > kb) return -1;
      if (ka < kb) return 1;
      // Deterministic tie-breaking on id if present
      if (a && b && a.id !== undefined && b.id !== undefined) {
        return a.id > b.id ? -1 : a.id < b.id ? 1 : 0;
      }
      return 0;
    });
  }
}

module.exports = {
  BinaryHeap,
  MinHeap,
  MaxHeap,
};

