use secret_toolkit::storage::{Item};
use serde::{Serialize, Deserialize};
use schemars::JsonSchema;
use cosmwasm_std::{Storage, StdResult, StdError};

pub const KEY_LAST_IBC_OPERATION: &[u8] = b"last_op";
pub const KEY_LAST_OPENED_CHANNEL: &[u8] = b"opened_channel";


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

pub static LAST_OPENED_CHANNEL: Item<String> = Item::new(KEY_LAST_IBC_OPERATION);

pub struct Channel {}
impl Channel {
    pub fn get_last_opened(store: &dyn Storage) -> StdResult<String> {
       LAST_OPENED_CHANNEL
            .load(store)
            .map_err(|_err| StdError::generic_err("no channel was opened on this contract yet"))
    }

    pub fn save_last_opened(store: &mut dyn Storage, channel_id: String) -> StdResult<()> {
        LAST_OPENED_CHANNEL.save(store, &channel_id)
    }
}
