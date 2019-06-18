class ServiceName extends Endpoint.Service {
    /**
     * {@inheritDoc} 
     */
    boot() {
        this.setRoute('route');
    }
}

DI.register({
    class: ServiceName,
    alias: 'aliasName',
});