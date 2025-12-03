// src/ai/model-architecture.ts
import * as tf from '@tensorflow/tfjs';
import { LABELS } from './vocab-manager';

export const createModel = (vocabSize: number, maxLen: number) => {
  const model = tf.sequential();

  // 1. Embedding Layer: Mengubah angka token menjadi vektor makna
  model.add(tf.layers.embedding({
    inputDim: vocabSize + 100, // Buffer untuk kata baru
    outputDim: 16, // Dimensi vektor kecil agar ringan (16 floats per kata)
    inputLength: maxLen
  }));

  // 2. Global Average Pooling: Meratakan vektor
  // (Alternatif ringan pengganti LSTM untuk klasifikasi sequence pendek)
  model.add(tf.layers.globalAveragePooling1d({}));

  // 3. Hidden Dense Layer
  model.add(tf.layers.dense({ units: 16, activation: 'relu' }));

  // 4. Output Layer: Probabilitas untuk 4 Kelas (ITEM, QTY, PRICE, O)
  // Masalah: Ini klasifikasi 1 kalimat -> 1 label?
  // Koreksi: Untuk NER (Per kata), kita butuh pendekatan sliding window atau seq2seq.
  // DEMI EFISIENSI FASE AWAL: Kita gunakan pendekatan "Heuristic Features + Neural Classification"
  // Model ini akan memprediksi TIPE dari SATU KATA berdasarkan konteksnya.
  
  model.add(tf.layers.dense({ units: LABELS.length, activation: 'softmax' }));

  model.compile({
    optimizer: tf.train.adam(0.01),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy']
  });

  return model;
};