// Arquivo: app/convidados.tsx
import React, { useState, useEffect } from 'react'; // <-- IMPORTANTE: Adicionamos o useEffect
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, StatusBar, KeyboardAvoidingView, Platform, Modal, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';

// --- IMPORTAÇÕES DO FIREBASE ---
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../src/firebase'; // Puxando o nosso banco de dados configurado!

const cores = {
  verde: '#A8D5BA',
  verdeEscuro: '#74A688',
  fundo: '#FAFAFA',
  branco: '#FFFFFF',
  textoEscuro: '#2D3142',
  cinza: '#EAEAEA',
  vermelho: '#FF9B9B',
  amareloConfirm: '#FDE293'
};

type Convidado = {
  id: string;
  nome: string;
  confirmado: boolean;
}

export default function ConvidadosScreen() {
  const router = useRouter();

  const [modalVisivel, setModalVisivel] = useState(false);
  const [novoConvidadoNome, setNovoConvidadoNome] = useState('');

  // A lista agora começa vazia [], pois o Firebase vai preenchê-la para nós!
  const [listaConvidados, setListaConvidados] = useState<Convidado[]>([]);

  // ==========================================
  // LÓGICA DO FIREBASE (NUVEM)
  // ==========================================

  // 1. LER OS DADOS EM TEMPO REAL (Sincronização entre os celulares)
  useEffect(() => {
    // Dizemos ao Firebase: "Fique de olho na coleção chamada 'convidados'"
    const referenciaColecao = collection(db, 'convidados');

    // onSnapshot é o "olheiro". Toda vez que algo mudar na nuvem, ele roda esse código
    const olheiro = onSnapshot(referenciaColecao, (snapshot) => {
      const convidadosDaNuvem = snapshot.docs.map(documento => {
        return {
          id: documento.id, // O ID agora é gerado pelo próprio Firebase
          nome: documento.data().nome,
          confirmado: documento.data().confirmado
        }
      }) as Convidado[];

      // Atualizamos a tela com os dados fresquinhos da nuvem!
      setListaConvidados(convidadosDaNuvem);
    });

    // Quando sairmos da tela, mandamos o "olheiro" parar de trabalhar para economizar bateria
    return () => olheiro();
  }, []);

  // 2. ADICIONAR NA NUVEM (Create)
  // Usamos 'async' porque salvar na internet demora alguns milissegundos
  const adicionarConvidadoFinal = async () => {
    if (novoConvidadoNome.trim() === '') return;

    try {
      // addDoc cria um registro novo lá na coleção 'convidados'
      await addDoc(collection(db, 'convidados'), {
        nome: novoConvidadoNome,
        confirmado: false
      });

      setNovoConvidadoNome('');
      setModalVisivel(false);
    } catch (erro) {
      Alert.alert('Ops!', 'Erro ao salvar convidado na nuvem.');
      console.log(erro);
    }
  };

  // 3. ATUALIZAR NA NUVEM (Update)
  // Precisamos receber o ID e saber se ele estava confirmado ou não
  const alternarConfirmacao = async (idParaAlterar: string, statusAtual: boolean) => {
    try {
      // doc() aponta para um convidado ESPECÍFICO lá na nuvem
      const referenciaConvidado = doc(db, 'convidados', idParaAlterar);

      // Invertemos o status atual dele (se era false, vira true)
      await updateDoc(referenciaConvidado, {
        confirmado: !statusAtual
      });
    } catch (erro) {
      Alert.alert('Ops!', 'Erro ao atualizar status.');
    }
  };

  // 4. APAGAR DA NUVEM (Delete)
  const removerConvidado = async (idParaRemover: string) => {
    try {
      const referenciaConvidado = doc(db, 'convidados', idParaRemover);
      await deleteDoc(referenciaConvidado); // Apaga de vez!
    } catch (erro) {
      Alert.alert('Ops!', 'Erro ao remover convidado.');
    }
  };

  // ==========================================
  // INTERFACE (Mantida igual, apenas conectada nas novas funções)
  // ==========================================

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" backgroundColor={cores.fundo} />

      <View style={styles.cabecalho}>
        <TouchableOpacity style={styles.botaoVoltar} onPress={() => router.back()}>
          <Text style={styles.textoBotaoVoltar}>{"< Voltar"}</Text>
        </TouchableOpacity>
        <Text style={styles.titulo}>Lista de Convidados</Text>
      </View>

      <View style={styles.resumo}>
        <Text style={styles.textoResumo}>Total: {listaConvidados.length} pessoas</Text>
        <Text style={styles.textoResumoSub}>
          Confirmados: {listaConvidados.filter(c => c.confirmado).length} | Aguardando: {listaConvidados.filter(c => !c.confirmado).length}
        </Text>
      </View>

      <FlatList
        data={listaConvidados}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listaContainer}
        renderItem={({ item }) => (
          <View style={[
            styles.itemConvidado,
            item.confirmado && { backgroundColor: cores.amareloConfirm, borderColor: '#F5DE91' }
          ]}>
            <View style={styles.itemEsquerda}>
              {/* Passamos o ID e o Status Atual para a função do Firebase */}
              <TouchableOpacity onPress={() => alternarConfirmacao(item.id, item.confirmado)} style={styles.botaoCheck}>
                <Text style={styles.emojiCheck}>{item.confirmado ? '✅' : '⬜'}</Text>
              </TouchableOpacity>

              <Text style={[
                styles.nomeConvidado,
                item.confirmado && styles.nomeConvidadoRiscado
              ]}>
                {item.nome}
              </Text>
            </View>

            <TouchableOpacity onPress={() => removerConvidado(item.id)}>
              <Text style={styles.botaoRemover}>❌</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <TouchableOpacity style={styles.botaoFlutuante} onPress={() => setModalVisivel(true)}>
        <Text style={styles.textoBotaoFlutuante}>+</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisivel}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisivel(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>Adicionar Convidado</Text>
              <TouchableOpacity onPress={() => setModalVisivel(false)}>
                <Text style={styles.modalBotaoFechar}>X</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.inputModal}
              placeholder="Nome completo do convidado..."
              placeholderTextColor="#A0A0A0"
              value={novoConvidadoNome}
              onChangeText={setNovoConvidadoNome}
              autoFocus={true}
            />

            <TouchableOpacity style={styles.botaoSalvarModal} onPress={adicionarConvidadoFinal}>
              <Text style={styles.textoBotaoSalvarModal}>Salvar Convidado</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}

// --- ESTILOS ATUALIZADOS ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
  cabecalho: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  botaoVoltar: {
    marginRight: 15,
  },
  textoBotaoVoltar: {
    color: cores.verdeEscuro,
    fontSize: 16,
    fontWeight: 'bold',
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: cores.textoEscuro,
  },
  resumo: {
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  textoResumo: {
    color: cores.textoEscuro,
    fontSize: 16,
    fontWeight: '700',
  },
  textoResumoSub: {
    color: '#888',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  listaContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Espaço extra pra não colar no botão flutuante
  },
  itemConvidado: {
    backgroundColor: cores.branco,
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: cores.cinza,
  },
  itemEsquerda: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, // Ocupa todo o espaço possível até chegar no botão 'Remover'
  },
  botaoCheck: {
    marginRight: 12,
  },
  emojiCheck: {
    fontSize: 22,
  },
  nomeConvidado: {
    fontSize: 16,
    color: cores.textoEscuro,
    fontWeight: '500',
    flex: 1, // Permite que o texto quebre linha se for muito longo
  },
  // Estilo bônus: riscar o nome
  nomeConvidadoRiscado: {
    textDecorationLine: 'line-through',
    color: '#383838',
  },
  botaoRemover: {
    fontSize: 18,
    marginLeft: 10,
  },

  // --- NOVOS ESTILOS DO BOTÃO FLUTUANTE ---
  botaoFlutuante: {
    position: 'absolute', // "Tira" ele da ordem natural da tela e trava no canto
    bottom: 30, // 30px do fundo
    right: 20, // 20px da direita
    backgroundColor: cores.verdeEscuro,
    width: 60,
    height: 60,
    borderRadius: 30, // Círculo perfeito
    justifyContent: 'center',
    alignItems: 'center',
    // Sombra para dar a sensação de flutuar
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5, // Sombra no Android
  },
  textoBotaoFlutuante: {
    color: cores.branco,
    fontSize: 32,
    fontWeight: 'bold',
  },

  // ==========================================
  // ESTILOS DO MODAL
  // ==========================================
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Fundo preto semitransparente desfocado
    justifyContent: 'flex-end', // Alinha a caixinha branca no FUNDO da tela
  },
  modalContent: {
    backgroundColor: cores.branco,
    borderTopLeftRadius: 25, // Arredonda apenas as bordas superiores
    borderTopRightRadius: 25,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24, // Dá mais espaço embaixo se for iPhone
    // Sombra no Modal
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: cores.textoEscuro,
  },
  modalBotaoFechar: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#888',
    padding: 5,
  },
  inputModal: {
    backgroundColor: cores.fundo,
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: cores.cinza,
    fontSize: 16,
    marginBottom: 20,
    color: cores.textoEscuro,
  },
  botaoSalvarModal: {
    backgroundColor: cores.verdeEscuro,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  textoBotaoSalvarModal: {
    color: cores.branco,
    fontSize: 18,
    fontWeight: 'bold',
  }
});