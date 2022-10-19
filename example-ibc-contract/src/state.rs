use secret_toolkit::storage::{Item};
use serde::{Serialize, Deserialize};
use schemars::JsonSchema;
use cosmwasm_std::{Storage, StdResult, StdError};

pub const KEY_LAST_IBC_OPERATION: &[u8] = b"last_op";


#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub struct Operation {
    pub name: String,
    pub parameters: Vec<String>,
}

pub static LAST_IBC_OPERATION: Item<Operation> = Item::new(KEY_LAST_IBC_OPERATION);

impl Operation {
    pub fn get_last(store: &dyn Storage) -> StdResult<Operation> {
        LAST_IBC_OPERATION
            .load(store)
            .map_err(|_err| StdError::generic_err("no ibc operation stored yet"))
    }

    pub fn save_last(store: &mut dyn Storage, operation: Operation) -> StdResult<()> {
        LAST_IBC_OPERATION.save(store, &operation)
    }
}
