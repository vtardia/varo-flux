![logo](https://rawgit.com/senecajs/varo/master/assets/varo-logo.svg)

# varo-flux

A Flux-style action dispatcher built on top of [Varo][varo] pattern matching library.

 - __Lead Maintainer:__ [Vito Tardia][lead]
 - __Sponsor:__ [nearForm][]

## Usage

 1. Add the package to you project dependencies

  ```console
  $ npm install varo-flux --save
  ```

 2. Use it as Flux dispatcher

  ```js
  // src/dispatcher/AppDispatcher.js
  import {Dispatcher} from 'varo-flux'
  export default new Dispatcher()
  ```

You can find a working example at: https://github.com/vtardia/seneca-varo-react-example.

## Contributing
The [Senecajs org][senecajs] encourages open participation. If you feel you can help in any way, be it with
documentation, examples, extra testing, or new features please get in touch.


## License
Copyright (c) 2015, Vito Tardia and other contributors.
Licensed under [MIT][].

[varo]: https://www.npmjs.com/package/varo
[lead]: http://vito.tardia.me
[nearForm]: http://www.nearform.com/
[MIT]: ./LICENSE
[senecajs]: http://senecajs.org
