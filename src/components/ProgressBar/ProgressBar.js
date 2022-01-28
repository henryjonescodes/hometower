import React from 'react'
import { ContentWrapper, ProgressBarPanel, StyledBarWrapper, StyledImage, StyledProgressHeader, StyledProgressPercentage, StyledProgressSubtitle, StyledProgressText, TextWrapper } from './ProgressBarElements'
const ProgressBar = ({value, max, text, loaded}) => {
    return (
        <>
            <ProgressBarPanel loaded = {loaded}>
                <ContentWrapper>
                    <TextWrapper>
                        <StyledProgressHeader>Henry Jones</StyledProgressHeader>
                        <StyledProgressSubtitle>Loading Three.js Homepage</StyledProgressSubtitle>
                    </TextWrapper>
                    <StyledImage src="/images/avatar.gif" alt="my head... spinning"/>
                    <StyledBarWrapper>                
                        <progress value= {value} max ={max}/>
                        <StyledProgressPercentage>{value}%</StyledProgressPercentage>
                    </StyledBarWrapper>
                    <StyledProgressText>{text}</StyledProgressText>
                </ContentWrapper>
            </ProgressBarPanel>
        </>
    )
}

export default ProgressBar
