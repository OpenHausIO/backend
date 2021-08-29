https://github.com/PavelDoGreat/WebGL-Fluid-Simulation

https://www.npmjs.com/package/flat
https://v8.dev/features/atomics

Implement a "super" "basic" class for things like:
- static schema definition -> wird nicht gehen wegen keyword "static" ?!!1!
- static obj validation -> wird nicht gehen wegen keyword "static" ?!!1!
- string/_id converting


### Migrate mongodb to rethinkdb
> https://stackoverflow.com/a/29240656/5781499


### Deploy/Build production
> https://tsh.io/blog/reduce-node-modules-for-better-performance/
```sh
npm install --production
```
Run "node-prune": https://github.com/tj/node-prune

```sh
du -sh ./node_modules/* | sort -nr | grep '\dM.*'
```

