class GlobalState{
    constructor(){
        this.user = {};
        this.userDetails = {};
    }

    setUser(user){
        this.user = user;
    }

    getUser(user){
        return this.user;
    }
}

export default new GlobalState();