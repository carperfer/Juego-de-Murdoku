# Reglas de Validación para Evitar Ambigüedades en Murdoku

## Problema Original
Los puzzles generados inicialmente podían ser **ambiguos**, es decir, tener múltiples soluciones válidas. Esto ocurría especialmente cuando las pistas consistían únicamente en combinaciones de filas y columnas sin objetos.

### Ejemplos de puzzles ambiguos rechazados:
```
Pistas ambiguas:
- Barón está en fila 2
- Dama está en columna 1
- Dra. está en fila 0
- Conde está en columna 3

→ Este puzzle puede tener 2+ soluciones válidas
```

## Solución Implementada

### 1. **Clasificación de Pistas**

Las pistas se clasifican en dos categorías según su poder de resolución:

#### **Pistas Fuertes (Strong Clues)**
Son pistas que ayudan a determinar la posición exacta de un sospechoso:

- **Objeto + Fila**: "El Barón está en la fila 2 donde se encontró el Puñal"
  - Si solo hay un Puñal en la fila 2, esto identifica la posición exacta
  
- **Objeto + Columna**: "La Dama está en la columna 3 con el Veneno"
  - Si solo hay un Veneno en la columna 3, esto identifica la posición exacta

- **Intersección Única**: "El Conde no está en la fila 0 ni en la columna 2"
  - Si esto deja solo una celda posible, se considera fuerte

#### **Pistas Débiles (Weak Clues)**
Son pistas que solo restringen parcialmente:

- **Solo Fila**: "La Dra. está en la fila 1"
  - Deja 4 posiciones posibles

- **Solo Columna**: "El Barón está en la columna 0"
  - Deja 4 posiciones posibles

### 2. **Regla de Validación Ultra-Estricta**

Para que un puzzle sea considerado **NO AMBIGUO**, debe cumplir:

```typescript
strongClueCount >= 2 && strongClueCount >= pureRowColCount
```

Donde:
- `strongClueCount`: Número de pistas fuertes (basadas en objetos)
- `pureRowColCount`: Número de pistas que solo mencionan fila O columna (sin objetos)

### Ejemplos de validación:

#### ✅ **VÁLIDO** - 2 pistas de objetos, 2 pistas de fila/columna
```
Pistas:
- El Barón está en la fila 2 donde se encontró el Puñal [FUERTE]
- La Dama está en la columna 1 con el Veneno [FUERTE]
- La Dra. está en la fila 0 [DÉBIL]
- El Conde está en la columna 3 [DÉBIL]

strongClueCount = 2
pureRowColCount = 2
2 >= 2 && 2 >= 2 → ✅ VÁLIDO
```

#### ✅ **VÁLIDO** - 3 pistas de objetos, 1 pista de fila/columna
```
Pistas:
- El Barón está en la columna 0 con la Huella [FUERTE]
- La Dama está en la fila 1 donde se encontró el Puñal [FUERTE]
- La Dra. no está en la fila 2 ni en la columna 0 [FUERTE si única]
- El Conde está en la columna 3 [DÉBIL]

strongClueCount = 3
pureRowColCount = 1
3 >= 2 && 3 >= 1 → ✅ VÁLIDO
```

#### ❌ **INVÁLIDO** - Solo 1 pista de objeto, 3 pistas de fila/columna
```
Pistas:
- El Barón está en la fila 2 donde se encontró el Puñal [FUERTE]
- La Dama está en la columna 1 [DÉBIL]
- La Dra. está en la fila 0 [DÉBIL]
- El Conde está en la columna 3 [DÉBIL]

strongClueCount = 1
pureRowColCount = 3
1 >= 2 → ❌ FALLA (menos de 2 pistas fuertes)
```

#### ❌ **INVÁLIDO** - Solo pistas de fila/columna sin objetos
```
Pistas:
- El Barón está en la fila 2 [DÉBIL]
- La Dama está en la columna 1 [DÉBIL]
- La Dra. está en la fila 0 [DÉBIL]
- El Conde está en la columna 3 [DÉBIL]

strongClueCount = 0
pureRowColCount = 4
0 >= 2 → ❌ FALLA (cero pistas fuertes)
```

## 3. **Regeneración Automática**

El juego intenta generar puzzles válidos mediante un sistema de reintentos:

```typescript
function createPuzzle(): PuzzleData {
  const maxAttempts = 50;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Generar grid aleatorio
    const grid = generateRandomGrid();
    
    // Generar solución N-Rook (1 por fila, 1 por columna)
    const solution = generateNRookSolution();
    
    // Generar pistas
    const clues = generateClues(grid, solution);
    
    // VALIDAR: ¿Las pistas son suficientemente fuertes?
    if (isValidPuzzle(clues)) {
      return { grid, solution, clues };
    }
    
    // Si no es válido, intentar de nuevo con nuevo grid/solución
  }
  
  // Si después de 50 intentos no se logra, usar el último
  return lastAttempt;
}
```

## 4. **Generación de Objetos en el Grid**

Para garantizar suficientes pistas basadas en objetos:

```typescript
// Colocar 6-7 objetos en el grid (38%-44% de las celdas)
const objectCount = 6 + Math.floor(Math.random() * 2); // 6 o 7

// Asegurar que los objetos estén bien distribuidos
// para que puedan formar pistas de "objeto + fila/columna"
```

## 5. **Test Suite**

Se crearon 9 tests automatizados que verifican:

1. ✅ Rechaza puzzle con 4 pistas puras fila/columna (0 objetos)
2. ✅ Rechaza puzzle con 3 pistas fila/columna + 1 objeto (1 objeto insuficiente)
3. ✅ Acepta puzzle con 2 pistas fila/columna + 2 objetos (mínimo válido)
4. ✅ Acepta puzzle con 1 pista fila/columna + 3 objetos (fuerte)
5. ✅ Acepta puzzle con 0 pistas fila/columna + 4 objetos (muy fuerte)
6. ✅ Rechaza puzzle con 2 filas + 2 columnas (sin objetos)
7. ✅ Acepta puzzle con 2 objetos + 2 filas
8. ✅ Acepta puzzle con 3 objetos únicos
9. ✅ Acepta puzzle con pistas de negación únicas

Ejecutar tests:
```bash
npx vitest run src/app/utils/puzzleValidator.test.ts
```

## Resumen

**La regla clave es:**
> Un puzzle Murdoku es NO AMBIGUO si tiene **al menos 2 pistas basadas en objetos** Y el número de pistas fuertes es mayor o igual al número de pistas débiles (solo fila/columna).

Esto garantiza que el puzzle tenga **una única solución** y sea resoluble mediante lógica deductiva sin adivinar.
