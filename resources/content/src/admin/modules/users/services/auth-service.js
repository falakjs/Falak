class AuthService extends Endpoint.Service {
    /**
     * {@inheritDoc} 
     */
    boot() {
        this.authorizable = null; // null means it will be auto detected if user is logged in or not
    }

    /**
     * Send a login request
     * 
     * @param FormHandler form
     * @returns Promise 
     */
    login(form) {
        this.authorizable = false;
        return this.endpoint.post(this.path('/login'), form);
    }

    /**
     * Log the user out
     */
    logout() {
        return this.endpoint.get(this.path('/logout'));
    }
    
    /**
     * Send a register request
     * 
     * @param FormHandler form
     * @returns Promise 
     */
    register(form) {
        return this.endpoint.post(this.path('/register'), form);
    }

    /**
     * Send a forget password email
     * 
     * @param string email
     */
    forgetPassword(email) {
        return this.endpoint.post(this.path('/forget-password'), {email});
    }

    /**
     * Reset user password
     * 
     * @param string code
     * @param FormHandler form
     */
    resetPassword(code, form) {
        return this.endpoint.post(this.path('/reset-password/' + code), form);
    }
}

DI.register({
    class: AuthService,
    alias: 'authService',
});