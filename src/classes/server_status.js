class SERVER_STATUS {
    //static STOPPED = new SERVER_STATUS('Stopped');
    //static LOADING = new SERVER_STATUS('Loading');
    //static RUNNING = new SERVER_STATUS('Running');
    //static STOPPING = new SERVER_STATUS('Stopping');
    //static CRASHED = new SERVER_STATUS('Crashed');


    static _staticConstructor(name, reason = null) {
        const out = new SERVER_STATUS(name, reason);
        return out;
    }

    static STOPPED(reason = null) {
        return this._staticConstructor("Stopped", reason);
    }
    static LOADING(reason = null) {
        return this._staticConstructor("Loading", reason);
    }
    static RUNNING(reason = null) {
        return this._staticConstructor("Running", reason);
    }
    static STOPPING(reason = null) {
        return this._staticConstructor("Stopping", reason);
    }
    static CRASHED(reason = null) {
        return this._staticConstructor("Crashed", reason);
    }

    constructor(name, reason = null) {
        this.name = name;
        this.reason = reason;
        this.time_set = Date.now();
        this.previous_status_list = []; 
    }

    toString() {
        let reason_string = "";
        if (this.reason != null) {
            reason_string = `: '${this.reason}`;
        }
        return `SERVER_STATUS:${this.name} (${new Date(this.time_set).toISOString()})${reason_string}'`;
        
    }

    toPrettyString() {
        let reason_string = "";
        if (this.reason != null) {
            reason_string = ` '${this.reason}`;
        }
        var options = [{day: 'numeric'}, {month: 'short'}, {year: 'numeric'}, {day: 'numeric'}, {hour: 'short'}, {minute: 'short'}, {second: 'numeric'}];
        const date_obj = new Date(this.time_set);
        const date_string = `${date_obj.getDate()}-${date_obj.getMonth()+1}-${date_obj.getFullYear()} ${date_obj.getHours()}:${date_obj.getMinutes()}:${date_obj.getSeconds()}`;
        return `${this.name} (${date_string})${reason_string}'`;
    }
    
    equals(server_status_obj) {
        try {
            if (this.name == server_status_obj.name) {
                return true;
            }
        } catch(err) {
            return false;
        }
        return false;
    }
}

module.exports = {SERVER_STATUS};