class MiddlewareClass {
    /**
     * Constructor
     * Define your required dependencies in the constructor params 
     */
    constructor() {}
    
    /**
     * {@inheritDoc}
     */
    name() {
        return 'middlewareName';
    }

    /**
     * {@inheritDoc}
     */
    handle() {
        //
        return Middleware.NEXT;
    }
}

DI.register({
    class: MiddlewareClass,
    alias: 'middlewareNameMiddleware',
});