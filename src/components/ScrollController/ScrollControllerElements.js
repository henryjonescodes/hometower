import styled from "styled-components";

export const Container = styled.div`
    position: absolute;
    height: 100vh;
    width: auto;
    display: flex;
    align-items: center;
    justify-content: left;
    /* border: 1px solid red; */

    transform: ${({Expanded}) => (!Expanded ? 'translateX(-200px);' : 'translateX(0);')};
    transition: all 1s ease-in-out;
`
export const ExpandButton = styled.button`
    position: relative;
    /* right: 10px; */
    /* top: 10px; */

    color: #aaa;
    background-color: transparent;
    border: none;
    font-size: 40px;

    &:hover{
        color: #555;
    }
`
export const ContentWrapper = styled.div`
    position: relative;
    /* height: 100%; */
    width: 200px;
    /* padding: 0 0 0 20px; */
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: 0px 30px 30px 0px;

    background-color: rgba(.5,.5,.5,.6);

`

export const NavItem = styled.button`
    height: 120px;
    margin: 5px 0 5px 0;
    width: 90%;
    /* border: 1px solid green; */
    border:none;

    color: #ddd;
    background-color: transparent;

    &:hover{
        color: #aaa;
    }
`

export const Header = styled.h1`
    /* margin: 0 0 15px 0; */

    font-weight: 700;
    font-size: 22px;
    text-transform: uppercase;
`

export const Paragraph = styled.p`
    /* margin: 0 0 9px 5px; */
    color: #888;
    font-weight: 300;
    font-size: 16px;
` 