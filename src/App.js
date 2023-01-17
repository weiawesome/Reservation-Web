import './App.css';
import {useEffect, useState} from "react";
import webSocket from 'socket.io-client'
import Lottie from "lottie-react";
import animationData from './Load.json'

function connectWebSocket(url) {
    const newSocket = webSocket(url);
    newSocket.on('connect', () => {
        console.log('Connected to webSocket server')
    })

    newSocket.on('disconnect', () => {
        console.log('Disconnected from webSocket server')
    })

    newSocket.on('reconnect', () => {
        console.log('Reconnected to webSocket server')
    })

    newSocket.on('reconnect_attempt',()=>{
        console.log('Reconnect Attempt')
    })

    newSocket.on('reconnect_error',()=>{
        console.log('Reconnect Error')
    })

    return newSocket
}

function App() {
    const [People,setPeople]=useState(0);
    const [PeopleDatas,setPeopleDatas]=useState({'台北':0,'新北':0,'桃園':0,'高雄':0});
    let [Adult,setAdult]=useState(1);
    let [Children,setChildren]=useState(0);
    const [ChooseAble,setChooseAble]=useState(false);
    const [ShopName,setShopName]=useState('新北')
    const Shops=['台北','新北','桃園','高雄']
    const [ws,setWs] = useState(null);
    const [Name,setName]=useState('');
    const [Phone,setPhone]=useState('');
    const [Loading,setLoading]=useState(false);
    const [SearchMode,setSearchMode]=useState(false);
    const [PersonalNumber,setPersonalNumber]=useState(-1);
    const [PersonalDatas,setPersonalDatas]=useState({'台北':-1,'新北':-1,'桃園':-1,'高雄':-1});
    const [LoginState,setLoginState]=useState(false);
    const [UserName,setUserName]=useState('');
    const [UserPhone,setUserPhone]=useState('');

    useEffect(()=>{
        setLoading(true);
        const newSocket = connectWebSocket('http://localhost:8000');
        setWs(newSocket);
        return () => {
            newSocket.disconnect();
        }
    },[])
    useEffect(()=>{
        if(ws){
            ws.on('People', message => {
                setLoading(false);
                console.log('People ',message);
                let JsonMessage=JSON.parse(message);
                setPeopleDatas(JsonMessage);
            })
            ws.on('Personal', message => {
                setLoading(false);
                console.log('Personal ',message);
                let JsonMessage=JSON.parse(message);
                setPersonalDatas(JsonMessage);
                setLoginState(true);
            })
            ws.on('Error',message=>{
                let JsonMessage=JSON.parse(message);
                setLoading(false);
                alert(JsonMessage.Error);
            })
            ws.on('BookStatus',message=>{
                let JsonMessage=JSON.parse(message);
                if(JsonMessage.Status){
                    setLoading(false);
                    alert('已成功訂位!');
                }
            })
            ws.on('disconnect',message=>{
                console.log('Disconnect')
            })
            return(()=>{
                ws.disconnect();
            })
        }
    },[ws]);
    useEffect(()=>{
        setPeople(PeopleDatas[ShopName]);
        setPersonalNumber(PersonalDatas[ShopName]);
    },[PeopleDatas,PersonalDatas,ShopName]);
    const Reservation=()=>{
        setChooseAble(false);
        if(Name===''){
            alert('姓名欄不得為空!')
            return;
        }
        if(!(Phone.match('09[0-9]{8}'))){
            alert('電話格式不符!')
            return;
        }
        if(SearchMode){
            if(ws===null){
                alert('目前伺服器出問題 非常抱歉! 請嘗試重刷!');
                return;
            }
            else{
                if(LoginState){
                    setUserName('');
                    setUserPhone('');
                    setPersonalNumber(-1);
                    setPersonalDatas({'台北':-1,'新北':-1,'桃園':-1,'高雄':-1})
                    setLoginState(false);
                }
                else{
                    setLoading(true);
                    const data={
                        'Name':Name,
                        'PhoneNumber':Phone,
                    }
                    ws.emit('Personal',JSON.stringify(data));
                    setUserName(Name);
                    setUserPhone(Phone);
                }
            }
        }
        else{
            if(Adult+Children===0){
                alert('總人數不得為0!');
                return;
            }
            if(ws===null){
                alert('目前伺服器出問題 非常抱歉! 請嘗試重刷!');
                return;
            }
            else{
                setLoading(true);
                const data={
                    'Name':Name,
                    'PhoneNumber':Phone,
                    'Adult':Adult,
                    'Children':Children,
                    'Shop':ShopName
                }
                ws.emit('Reservation',JSON.stringify(data));
            }
        }

    }
    return (
        <div className="App">
            {Loading &&(
                <Lottie animationData={animationData} loop={true} autoplay={true} />
            )}
            {(!Loading) && (
                <h1 className={'App-Title'}>Wei訂位系統</h1>
            )}
            {(!Loading) && (
                <div className={'App-div'}>
                    <h2>{SearchMode?PersonalNumber<0?PersonalNumber<-1?'尚未訂位':'尚未登入':'前面還有 '+PersonalNumber+' 組':'目前候位人數 '+People+' 組'}</h2>
                    {(!ChooseAble) &&(
                        <button className={'App-div-shop'} onClick={()=>{setChooseAble(true);}}>
                            <h2 className={'App-Text'}>店家: {ShopName}</h2>
                        </button>
                    )}
                    {ChooseAble && (
                        <div className={'App-ul'}>
                            <button className={'App-btns'} onClick={()=>{setShopName(Shops[0]);setChooseAble(false);}}><h4>{Shops[0]}</h4></button>
                            <button className={'App-btns'} onClick={()=>{setShopName(Shops[1]);setChooseAble(false);}}><h4>{Shops[1]}</h4></button>
                            <button className={'App-btns'} onClick={()=>{setShopName(Shops[2]);setChooseAble(false);}}><h4>{Shops[2]}</h4></button>
                            <button className={'App-btns'} onClick={()=>{setShopName(Shops[3]);setChooseAble(false);}}><h4>{Shops[3]}</h4></button>
                        </div>
                    )}
                    {((!LoginState) || (!SearchMode)) &&(
                        <div>
                            <h3>姓名 <input type={'text'} size={10} id={'name'} placeholder="童維維" className={'App-input'} onChange={(e)=>{
                                setName(e.target.value);
                            }}/></h3>
                            <h3>電話 <input type={'tel'} size={10} id={'phone'} placeholder="0912345678" pattern="09[0-9]{8}" maxLength={10} className={'App-input'} onChange={(e)=>{
                                let tmp=e.target.value,res='';
                                for (var i in tmp){
                                    if(tmp[i].match('[0-9]')){
                                        res+=tmp[i];
                                    }
                                }
                                e.target.value=res;
                                setPhone(e.target.value);
                            }}/></h3>
                        </div>
                    )}

                    {(!SearchMode) &&(
                        <div className={'App-div-div'}>
                            <h3>大人 : {Adult} 位
                                <button onClick={()=>{
                                    Adult+=1;
                                    setAdult(Adult);
                                }} className={'App-plus'}>+</button>
                                <button onClick={()=>{
                                    if(Adult>0){
                                        Adult-=1;
                                        setAdult(Adult);
                                    }
                                }} className={'App-minus'}>–</button>
                            </h3>
                            <h3>小孩 : {Children} 位
                                <button onClick={()=>{
                                    Children+=1;
                                    setChildren(Children);
                                }} className={'App-plus'}>+</button>
                                <button onClick={()=>{
                                    if(Children>0){
                                        Children-=1;
                                        setChildren(Children);
                                    }
                                }} className={'App-minus'}>–</button>
                            </h3>
                        </div>
                    )}
                    {LoginState && (SearchMode) &&(
                        <div>
                            <h3>姓名 {UserName}</h3>
                            <h3>電話 {UserPhone}</h3>
                        </div>
                    )}
                    <button className={'App-submit-btn'} onClick={Reservation}>
                        <h3>{SearchMode?LoginState?'登出':'登入 & 查詢':'訂位'}</h3>
                    </button>
                    <h4 onClick={()=>{setSearchMode(!SearchMode)}} className={'App-get'}>{SearchMode?'返回訂位':'查詢候位'}</h4>
                </div>
            )}
        </div>
    );
}

export default App;
