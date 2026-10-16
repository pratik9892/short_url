class baseError extends Error {
    constructor(name,description,statuscode,details){
                super(description)
                this.name = name;
                this.statuscode = statuscode;
                this.details = details
        }
    }


export {baseError}