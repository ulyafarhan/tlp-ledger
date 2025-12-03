// src/ai/data-gen.ts
import * as tf from '@tensorflow/tfjs';
import { vocab, LABELS } from './vocab-manager';

// Struktur: [Prev_Word_Idx, Current_Word_Idx, Next_Word_Idx]
export const WINDOW_SIZE = 3; 

const RAW_DATA = [
  { text: "beli 2 nasi goreng 15rb", tags: ["O", "QTY", "ITEM", "ITEM", "PRICE"] },
  { text: "3 ayam bakar", tags: ["QTY", "ITEM", "ITEM"] },
  { text: "kopi hitam 5000", tags: ["ITEM", "ITEM", "PRICE"] },
  { text: "jual pulsa 10k", tags: ["O", "ITEM", "PRICE"] },
  { text: "semen 1 sak", tags: ["ITEM", "QTY", "QTY"] }, // 'sak' dianggap bagian qty unit
];

export const generateTrainingSet = () => {
  const xs: number[][] = []; // Features
  const ys: number[][] = []; // Labels (One Hot Encoding)

  RAW_DATA.forEach(data => {
    const words = data.text.split(' ');
    // Update Vocab
    words.forEach(w => vocab.add(w));

    const tokenIds = words.map(w => vocab.wordIndex[w.toLowerCase().replace(/[.,]/g, '')] || 1);

    // Sliding Window
    for (let i = 0; i < tokenIds.length; i++) {
      const prev = i > 0 ? tokenIds[i-1] : 0; // 0 = Padding
      const curr = tokenIds[i];
      const next = i < tokenIds.length - 1 ? tokenIds[i+1] : 0;

      xs.push([prev, curr, next]); // Input 3 kata

      // Output One Hot
      const labelIndex = LABELS.indexOf(data.tags[i]);
      const oneHot = Array(LABELS.length).fill(0);
      oneHot[labelIndex] = 1;
      ys.push(oneHot);
    }
  });

  return {
    xs: tf.tensor2d(xs),
    ys: tf.tensor2d(ys)
  };
};