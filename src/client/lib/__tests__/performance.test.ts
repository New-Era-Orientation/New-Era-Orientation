import { describe, it, expect } from 'vitest';
import { 
    debounce, 
    throttle, 
    createCacheKey, 
    MemoryCache 
} from '@/client/lib/performance';

describe('Performance Utilities', () => {
    describe('debounce', () => {
        it('delays function execution', async () => {
            let callCount = 0;
            const fn = debounce(() => callCount++, 100);
            
            fn();
            fn();
            fn();
            
            expect(callCount).toBe(0);
            
            await new Promise(r => setTimeout(r, 150));
            expect(callCount).toBe(1);
        });
    });

    describe('throttle', () => {
        it('limits function calls', async () => {
            let callCount = 0;
            const fn = throttle(() => callCount++, 100);
            
            fn(); // Should execute
            fn(); // Should be throttled
            fn(); // Should be throttled
            
            expect(callCount).toBe(1);
            
            await new Promise(r => setTimeout(r, 150));
            fn(); // Should execute
            expect(callCount).toBe(2);
        });
    });

    describe('createCacheKey', () => {
        it('creates consistent cache keys', () => {
            const key1 = createCacheKey('api/users', { page: 1, limit: 10 });
            const key2 = createCacheKey('api/users', { limit: 10, page: 1 });
            
            expect(key1).toBe(key2);
        });

        it('ignores undefined values', () => {
            const key = createCacheKey('api/users', { page: 1, filter: undefined });
            expect(key).toBe('api/users?page=1');
        });
    });

    describe('MemoryCache', () => {
        it('stores and retrieves values', () => {
            const cache = new MemoryCache<string>(60);
            cache.set('key', 'value');
            
            expect(cache.get('key')).toBe('value');
        });

        it('returns null for missing keys', () => {
            const cache = new MemoryCache<string>(60);
            expect(cache.get('missing')).toBeNull();
        });

        it('expires entries after TTL', async () => {
            const cache = new MemoryCache<string>(0.1); // 100ms TTL
            cache.set('key', 'value');
            
            expect(cache.get('key')).toBe('value');
            
            await new Promise(r => setTimeout(r, 150));
            expect(cache.get('key')).toBeNull();
        });

        it('clears all entries', () => {
            const cache = new MemoryCache<string>(60);
            cache.set('key1', 'value1');
            cache.set('key2', 'value2');
            
            cache.clear();
            
            expect(cache.get('key1')).toBeNull();
            expect(cache.get('key2')).toBeNull();
        });

        it('deletes specific entries', () => {
            const cache = new MemoryCache<string>(60);
            cache.set('key1', 'value1');
            cache.set('key2', 'value2');
            
            cache.delete('key1');
            
            expect(cache.get('key1')).toBeNull();
            expect(cache.get('key2')).toBe('value2');
        });
    });
});
