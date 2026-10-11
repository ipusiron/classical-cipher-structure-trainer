/* 見分け（LabCore.classify）の当たり具合。tools/eval-classify.js が書き出す（手で直さない） */
(function (root) {
  'use strict';
  const data = {
    "seed": 97,
    "perClass": 300,
    "train": {
      "title": "Pride and Prejudice",
      "ebook": 1342,
      "letters": 563924,
      "length": 100,
      "accuracy": {
        "transposition": 99.7,
        "mono": 100,
        "poly": 97,
        "mean": 98.9
      }
    },
    "test": {
      "title": "A Tale of Two Cities",
      "ebook": 98,
      "letters": 584856
    },
    "classes": {
      "transposition": "columnar transposition, random keyword of 5-9 letters",
      "mono": "simple substitution, uniformly random key",
      "poly": "Vigenere, random keyword of 3-8 letters"
    },
    "thresholds": {
      "chiMax": 115,
      "icMin": 0.052
    },
    "evaluation": {
      "50": {
        "transposition": 100,
        "mono": 88.3,
        "poly": 85.7,
        "mean": 91.3
      },
      "100": {
        "transposition": 99.7,
        "mono": 100,
        "poly": 93.7,
        "mean": 97.8
      },
      "200": {
        "transposition": 100,
        "mono": 100,
        "poly": 95.3,
        "mean": 98.4
      },
      "400": {
        "transposition": 100,
        "mono": 100,
        "poly": 98.7,
        "mean": 99.6
      }
    }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = data;
  else root.ClassifyAccuracy = data;
})(typeof globalThis !== 'undefined' ? globalThis : this);
