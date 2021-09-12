export default class PriorityQueue {
  // INSTANCE VARIABLES

  _descending;
  _orderedBy

  // INSTANCE HELPER METHODS

  _compare;

  constructor(orderedBy, descending) {
    this._orderedBy = orderedBy;
    this._descending = descending;
    this._heap = [];
    if (descending) {
      this._compare = (val1, val2) => {
        return val1 >= val2;
      };
    } else {
      this._compare = (val1, val2) => {
        return val1 <= val2;
      };
    }
  }

  // INTERFACE METHODS

  size() {
    return this._heap.length;
  }

  dequeue() {
    if (this._isEmpty()) {
      return null;
    } else {
      const toReturn = this._heap.shift();
      this._heap.unshift(this._heap.pop());
      this._siftDown();
      return toReturn;
    }
  }

  enqueue(item) {
    this._heap.push(item);
    this._siftUp();
  }

  // PRIVATE HELPER METHODS

  _isEmpty = () => {
    return this._heap.length == 0;
  };

  _swap = (ind1, ind2) => {
    const saved = this._heap[ind2];
    this._heap[ind2] = this._heap[ind1];
    this._heap[ind1] = saved;
  };

  _siftUp = () => {
    let i = this._heap.length - 1;
    let last;
    while (i != last) {
      last = i;
      const parentIndex = Math.max(Math.floor((i - 1) / 2), 0);
      const parentValue = this._heap[parentIndex][this._orderedBy];
      if (
        parentValue &&
        this._compare(this._heap[i][this._orderedBy], parentValue)
      ) {
        this._swap(parentIndex, i);
        i = parentIndex;
      }
    }
  };

  _siftDown = () => {
    let i = 0;
    let last;
    while (i != last) {
      last = i;
      const rightChildIndex = i * 2 + 2;
      const leftChildIndex = i * 2 + 1;
      const rightChild =
        rightChildIndex < this._heap.length
          ? this._heap[rightChildIndex][this._orderedBy]
          : null;
      const leftChild =
        leftChildIndex < this._heap.length
          ? this._heap[leftChildIndex][this._orderedBy]
          : null;
      if (rightChild && leftChild) {
        if (
          this._compare(leftChild, rightChild) &&
          this._compare(leftChild, this._heap[i][this._orderedBy])
        ) {
          this._swap(i, leftChildIndex);
          i = leftChildIndex;
        } else if (
          this._compare(rightChild, leftChild) &&
          this._compare(rightChild, this._heap[i][this._orderedBy])
        ) {
          this._swap(i, rightChildIndex);
          i = rightChildIndex;
        }
      } else if (
        rightChild &&
        this._compare(rightChild, this._heap[i][this._orderedBy])
      ) {
        this._swap(i, rightChildIndex);
        i = rightChildIndex;
      } else if (
        leftChild &&
        this._compare(leftChild, this._heap[i][this._orderedBy])
      ) {
        this._swap(i, leftChildIndex);
        i = leftChildIndex;
      }
    }
  };
}
