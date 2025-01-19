import { snakeCaseToCamelCase } from '../../utils/string-util';

describe('snakeCaseToCamelCase', () => {
  it('string with no hyphen', () => {
    expect(snakeCaseToCamelCase('abc')).toEqual('abc');
  });

  it('string with hyphen in middle', () => {
    expect(snakeCaseToCamelCase('snake-case')).toEqual('snakeCase');
  });

  it('string with leading hypen', () => {
    expect(snakeCaseToCamelCase('-snake')).toEqual('snake');
  });

  it('string with trailing hypen', () => {
    expect(snakeCaseToCamelCase('snake-')).toEqual('snake');
  });

});
