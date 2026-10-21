import test from 'node:test';
import assert from 'node:assert/strict';
import {
  UNIT, measurePolygon, measureCircle, createPreset,
  rotatePolygon, scalePolygon, reflectPolygon, selfIntersects
} from '../src/geometry.mjs';

const near = (a, b, tolerance = 1e-9) => assert.ok(Math.abs(a - b) < tolerance, a + ' not close to ' + b);

test('3-4-5 right triangle has area 6, perimeter 12 and angle sum 180', () => {
  const triangle = measurePolygon([{ x: 0, y: 0 }, { x: 3 * UNIT, y: 0 }, { x: 0, y: 4 * UNIT }]);
  near(triangle.area, 6);
  near(triangle.perimeter, 12);
  near(triangle.heronArea, 6);
  near(triangle.angleSum, 180);
  assert.equal(triangle.name, 'Right triangle');
});

test('rectangle and square classified using measurements', () => {
  const rect = measurePolygon([{ x: 0, y: 0 }, { x: 80, y: 0 }, { x: 80, y: 120 }, { x: 0, y: 120 }]);
  near(rect.area, 6);
  near(rect.perimeter, 10);
  assert.equal(rect.name, 'Rectangle');
  const square = measurePolygon(createPreset('square').points);
  assert.equal(square.name, 'Square');
  near(square.angleSum, 360);
});

test('circle formulas use radius in mathematical units', () => {
  const circle = measureCircle(2 * UNIT);
  near(circle.radius, 2);
  near(circle.diameter, 4);
  near(circle.area, 4 * Math.PI);
  near(circle.perimeter, 4 * Math.PI);
});

test('rigid transformations preserve area and perimeter; scaling changes by predictable factors', () => {
  const p = createPreset('triangle').points;
  const baseline = measurePolygon(p);
  for (const transformed of [rotatePolygon(p, 63), reflectPolygon(p)]) {
    near(measurePolygon(transformed).area, baseline.area);
    near(measurePolygon(transformed).perimeter, baseline.perimeter);
  }
  near(measurePolygon(scalePolygon(p, 1.25)).area, baseline.area * 1.25 ** 2);
  near(measurePolygon(scalePolygon(p, 1.25)).perimeter, baseline.perimeter * 1.25);
});

test('regular pentagon has regular classification and 540 degree angle sum', () => {
  const five = measurePolygon(createPreset('regular', 5).points);
  assert.equal(five.name, 'Regular 5-gon');
  near(five.angleSum, 540);
});

test('crossing sides are diagnosed rather than labelled a conventional simple quadrilateral', () => {
  const bowtie = [{ x: 0, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }, { x: 100, y: 0 }];
  assert.equal(selfIntersects(bowtie), true);
  const measured = measurePolygon(bowtie);
  assert.equal(measured.invalid, true);
  assert.equal(measured.name, 'Crossed polygon');
});
