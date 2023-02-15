

export const provider = (state = {}, aciton) => {
    switch (aciton.type) {
        case 'PROVIDER_LOADED':
            return {
                ...state,
                connection: aciton.connection
            }
        
        default:
            return state
    }

}
