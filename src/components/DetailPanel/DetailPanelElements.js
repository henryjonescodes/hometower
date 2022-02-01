import styled from 'styled-components'

export const DetailContainer = styled.div`
    position: fixed;
    width: 100%;
    bottom: 0px;
    display: flex;
    justify-content: center;
    z-index: 20;
    transform: ${({Expanded}) => (!Expanded ? 'translateY(100%);' : 'translateY(0);')};
    transition: all 1s ease-in-out;
`

export const DetailContent = styled.div`
    width: 80%;
    max-width: 800px;
    border-radius: 15px 15px 0 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    background-color: rgba(256,256,256,.6);
`

export const DetailNav = styled.div`
    position: relative;
    /* border: 2px solid green; */
    display: flex;
    flex-direction: row;
    width: 100%;
    justify-content: center;
    align-items: center ;
`

export const DetailHeader = styled.h1`
    margin: 5px 0px 0px 0px;
    max-width: 75%;
    text-align: center;
    font-size: 40px;
    margin-right: auto;
    margin-left: auto;

    @media screen and (max-width: 700px){        
        font-size: 30px;
    }
`

export const DetailBody = styled.p`
    margin: 5px 0px 30px 0px;
    border-top: 2px groove #000;
    font-size: 20px;
    padding-top: 5px;
    width: 90%;
`

export const Button = styled.button`
    position: absolute;
    top: 2px;
    left: 0px;
    margin-right: auto;
    margin-left: 0;
    color: #000;
    background-color: transparent;
    border: none;
    font-size: 40px;

    &:hover{
        color: #555;
    }
`