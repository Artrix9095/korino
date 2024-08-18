use serde::de::{self, Deserialize, Deserializer, Visitor};
use serde::ser::{Serialize, Serializer};
use std::fmt;
use std::net::{Ipv4Addr, SocketAddrV4};

#[derive(Debug, Clone)]
pub struct Peers(pub Vec<SocketAddrV4>);
pub struct PeersVisitor;

impl<'de> Visitor<'de> for PeersVisitor {
    type Value = Peers;

    fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
        formatter.write_str("a byte string whose length is a multiple of 6")
    }

    fn visit_bytes<E>(self, v: &[u8]) -> Result<Self::Value, E>
    where
        E: de::Error,
    {
        if v.len() % 6 != 0 {
            return Err(E::custom(format!("length is {}", v.len())));
        }

        let mut peers = Vec::with_capacity(v.len() / 6);

        for chunk in v.chunks_exact(6) {
            peers.push(SocketAddrV4::new(
                Ipv4Addr::new(chunk[0], chunk[1], chunk[2], chunk[3]),
                ((chunk[4] as u16) << 8) | (chunk[5] as u16),
            ));
        }

        Ok(Peers(peers))
    }
}

impl<'de> Deserialize<'de> for Peers {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        deserializer.deserialize_bytes(PeersVisitor)
    }
}

impl Serialize for Peers {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut single_slice = Vec::with_capacity(6 * self.0.len());
        for peer in &self.0 {
            single_slice.extend(peer.ip().octets());
            single_slice.extend(peer.port().to_be_bytes());
        }
        serializer.serialize_bytes(&single_slice)
    }
}

impl Peers {
    pub fn parse(bytes: &[u8]) -> Result<Peers, String> {
        serde_bencode::from_bytes(bytes).map_err(|err| err.to_string())
    }
}

